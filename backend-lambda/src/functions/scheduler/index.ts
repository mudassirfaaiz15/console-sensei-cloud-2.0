import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, EventBridgeEvent } from 'aws-lambda';
import { SchedulerEvent, ApiResponse, Alert, ScoreResult } from '../../types';
import { getLatestScanForUser, getScanResult } from '../../utils/dynamodb';
import { calculateHygieneScore } from '../../utils/score-calculator';
import { compareScan } from '../../utils/scan-comparison';
import { storeAlert, isDuplicateAlert } from '../../utils/alert-storage';
import { sendAlert } from '../../utils/notification-service';
import { getAlertConfig, getUserConfig } from '../../utils/user-config';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { randomUUID } from 'crypto';

/**
 * Scheduler Lambda Handler
 * 
 * Executes scheduled scans and sends alerts
 * 
 * Requirements:
 * - 10.1: Use AWS EventBridge to trigger scans on a schedule
 * - 10.2: Support daily, weekly, and custom cron schedule configurations
 * - 10.3: Compare results with the previous scan
 * - 10.4-10.6: Evaluate alert thresholds
 * - 10.7-10.8: Send notifications via email and Slack
 * - 10.12: Implement alert deduplication
 * 
 * @param event - EventBridge event, API Gateway event, or direct invocation event
 * @param context - Lambda context
 * @returns API Gateway response or void for EventBridge
 */
export const handler = async (
  event: EventBridgeEvent<string, SchedulerEvent> | APIGatewayProxyEvent | SchedulerEvent,
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  console.log('Scheduler Lambda invoked', { event, context });

  try {
    // Check if this is an API Gateway request
    const isApiGateway = 'httpMethod' in event;

    if (isApiGateway) {
      // API Gateway request - not implemented yet
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Schedule management endpoints not yet implemented',
          timestamp: new Date().toISOString(),
          requestId: context.awsRequestId,
        },
      };

      return {
        statusCode: 501,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response),
      };
    } else {
      // EventBridge trigger - execute scheduled scan
      const schedulerEvent = event as EventBridgeEvent<string, SchedulerEvent>;
      const { userId, scheduleConfig } = schedulerEvent.detail;

      console.log('Executing scheduled scan', { userId });

      await executeScheduledScan(userId, context);
      return;
    }
  } catch (error) {
    console.error('Error in Scheduler Lambda:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      },
    };

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  }
};

/**
 * Execute a scheduled scan for a user
 */
async function executeScheduledScan(userId: string, context: Context): Promise<void> {
  try {
    // Get user configuration
    const userConfig = await getUserConfig(userId);
    if (!userConfig) {
      console.error('User configuration not found', { userId });
      return;
    }

    // Invoke Scan Lambda to get current scan results
    console.log('Invoking Scan Lambda', { userId });
    const scanResult = await invokeScanLambda(userId, userConfig.roleArn);

    // Get previous scan for comparison
    const previousScan = await getLatestScanForUser(userId);

    // Calculate score for current scan
    const currentScore = calculateHygieneScore(scanResult);

    // Get previous score if available
    let previousScore: ScoreResult | null = null;
    if (previousScan) {
      previousScore = calculateHygieneScore(previousScan);
    }

    // Compare scans
    const comparison = compareScan(scanResult, previousScan, currentScore, previousScore);

    console.log('Scan comparison complete', {
      userId,
      newResources: comparison.newResources.length,
      deletedResources: comparison.deletedResources.length,
      newSecurityIssues: comparison.newSecurityIssues.length,
      costChange: comparison.costChange,
    });

    // Get user's alert configuration
    const alertConfig = await getAlertConfig(userId);

    // Evaluate alert thresholds and generate alerts
    const alerts = evaluateAlertThresholds(
      userId,
      comparison,
      currentScore,
      previousScore,
      alertConfig
    );

    console.log('Alerts generated', { userId, alertCount: alerts.length });

    // Send alerts (with deduplication)
    for (const alert of alerts) {
      const isDuplicate = await isDuplicateAlert(userId, alert.deduplicationKey);

      if (isDuplicate) {
        console.log('Skipping duplicate alert', {
          userId,
          alertType: alert.alertType,
          deduplicationKey: alert.deduplicationKey,
        });
        continue;
      }

      // Store alert in history
      await storeAlert(alert);

      // Send notification
      await sendAlert(alert, alertConfig);
    }

    console.log('Scheduled scan completed successfully', { userId });
  } catch (error) {
    console.error('Error executing scheduled scan', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Invoke Scan Lambda to get current scan results
 */
async function invokeScanLambda(userId: string, roleArn?: string): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const payload = {
    userId,
    ...(roleArn && { roleArn }),
  };

  const command = new InvokeCommand({
    FunctionName: process.env.SCAN_LAMBDA_NAME || 'ConsoleSensei-Scan',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);

  if (response.FunctionError) {
    throw new Error(`Scan Lambda error: ${response.FunctionError}`);
  }

  const payload_str = response.Payload ? new TextDecoder().decode(response.Payload as Uint8Array) : '{}';
  const result = JSON.parse(payload_str);

  return result;
}

/**
 * Evaluate alert thresholds and generate alerts
 */
function evaluateAlertThresholds(
  userId: string,
  comparison: any,
  currentScore: ScoreResult,
  previousScore: ScoreResult | null,
  alertConfig: any
): Alert[] {
  const alerts: Alert[] = [];

  // Alert 1: New security issues detected
  if (comparison.newSecurityIssues.length > 0) {
    const alert: Alert = {
      alertId: `alert_${randomUUID()}`,
      userId,
      timestamp: new Date().toISOString(),
      alertType: 'new_security_issues',
      severity: comparison.newSecurityIssues[0].severity,
      message: `${comparison.newSecurityIssues.length} new security issue(s) detected`,
      details: {
        newIssues: comparison.newSecurityIssues,
        changeSummary: comparison.summary,
      },
      channels: getEnabledChannels(alertConfig),
      deduplicationKey: `new_security_issues_${userId}_${new Date().toISOString().split('T')[0]}`,
    };
    alerts.push(alert);
  }

  // Alert 2: Hygiene score drop
  if (previousScore && currentScore.overallScore < previousScore.overallScore) {
    const scoreDrop = previousScore.overallScore - currentScore.overallScore;
    if (scoreDrop >= alertConfig.thresholds.hygieneScoreDrop) {
      const alert: Alert = {
        alertId: `alert_${randomUUID()}`,
        userId,
        timestamp: new Date().toISOString(),
        alertType: 'hygiene_score_drop',
        severity: scoreDrop > 20 ? 'high' : 'medium',
        message: `Hygiene score dropped by ${scoreDrop.toFixed(1)} points`,
        details: {
          previousScore: previousScore.overallScore,
          currentScore: currentScore.overallScore,
          scoreChange: -scoreDrop,
          changeSummary: comparison.summary,
        },
        channels: getEnabledChannels(alertConfig),
        deduplicationKey: `hygiene_score_drop_${userId}_${new Date().toISOString().split('T')[0]}`,
      };
      alerts.push(alert);
    }
  }

  // Alert 3: Cost increase
  if (comparison.costChange > alertConfig.thresholds.costIncreasePercent) {
    const alert: Alert = {
      alertId: `alert_${randomUUID()}`,
      userId,
      timestamp: new Date().toISOString(),
      alertType: 'cost_increase',
      severity: comparison.costChange > 50 ? 'high' : 'medium',
      message: `Estimated monthly cost increased by ${comparison.costChange.toFixed(1)}%`,
      details: {
        costChange: comparison.costChange,
        costDifference: comparison.costDifference,
        changeSummary: comparison.summary,
      },
      channels: getEnabledChannels(alertConfig),
      deduplicationKey: `cost_increase_${userId}_${new Date().toISOString().split('T')[0]}`,
    };
    alerts.push(alert);
  }

  return alerts;
}

/**
 * Get enabled notification channels
 */
function getEnabledChannels(alertConfig: any): ('email' | 'slack')[] {
  const channels: ('email' | 'slack')[] = [];

  if (alertConfig.email?.enabled) {
    channels.push('email');
  }

  if (alertConfig.slack?.enabled) {
    channels.push('slack');
  }

  return channels;
}

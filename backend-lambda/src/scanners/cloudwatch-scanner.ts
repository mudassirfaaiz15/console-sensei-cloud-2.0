import {
  DescribeLogGroupsCommand,
  CloudWatchLogsClient,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeAlarmsCommand,
  ListMetricsCommand,
  CloudWatchClient,
} from '@aws-sdk/client-cloudwatch';
import { Resource, ScanError } from '../types';

/**
 * CloudWatch Resource Scanner
 * 
 * Requirements:
 * - 3.8: Scan CloudWatch log groups, alarms, and metrics
 */

export interface CloudWatchScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all CloudWatch resources in a region
 * 
 * @param cwClient - CloudWatch client for the region
 * @param cwLogsClient - CloudWatch Logs client for the region
 * @param region - AWS region
 * @returns CloudWatch resources and errors
 */
export async function scanCloudWatchResources(
  cwClient: CloudWatchClient,
  cwLogsClient: CloudWatchLogsClient,
  region: string
): Promise<CloudWatchScanResult> {
  console.log('Scanning CloudWatch resources', { region });

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  // Scan CloudWatch Log Groups
  try {
    const logGroups = await scanLogGroups(cwLogsClient, region);
    resources.push(...logGroups);
  } catch (error) {
    errors.push(createScanError('CloudWatch_LogGroups', region, error));
  }

  // Scan CloudWatch Alarms
  try {
    const alarms = await scanAlarms(cwClient, region);
    resources.push(...alarms);
  } catch (error) {
    errors.push(createScanError('CloudWatch_Alarms', region, error));
  }

  // Scan CloudWatch Metrics (sample only to avoid excessive API calls)
  try {
    const metrics = await scanMetrics(cwClient, region);
    resources.push(...metrics);
  } catch (error) {
    errors.push(createScanError('CloudWatch_Metrics', region, error));
  }

  console.log('CloudWatch scan completed', {
    region,
    resourceCount: resources.length,
    errorCount: errors.length,
  });

  return { resources, errors };
}

/**
 * Scan CloudWatch Log Groups
 */
async function scanLogGroups(
  cwLogsClient: CloudWatchLogsClient,
  region: string
): Promise<Resource[]> {
  const command = new DescribeLogGroupsCommand({});
  const response = await cwLogsClient.send(command);

  const resources: Resource[] = [];

  if (response.logGroups) {
    for (const logGroup of response.logGroups) {
      if (!logGroup.logGroupName) continue;

      resources.push({
        resourceId: logGroup.arn || logGroup.logGroupName,
        resourceName: logGroup.logGroupName,
        resourceType: 'CloudWatch_LogGroup',
        region,
        state: 'active',
        creationDate: logGroup.creationTime
          ? new Date(logGroup.creationTime).toISOString()
          : undefined,
        tags: {}, // Tags require separate API call
        metadata: {
          storedBytes: logGroup.storedBytes,
          retentionInDays: logGroup.retentionInDays,
          metricFilterCount: logGroup.metricFilterCount,
          kmsKeyId: logGroup.kmsKeyId,
        },
      });
    }
  }

  console.log('Scanned CloudWatch Log Groups', { region, count: resources.length });
  return resources;
}

/**
 * Scan CloudWatch Alarms
 */
async function scanAlarms(
  cwClient: CloudWatchClient,
  region: string
): Promise<Resource[]> {
  const command = new DescribeAlarmsCommand({});
  const response = await cwClient.send(command);

  const resources: Resource[] = [];

  if (response.MetricAlarms) {
    for (const alarm of response.MetricAlarms) {
      if (!alarm.AlarmName) continue;

      resources.push({
        resourceId: alarm.AlarmArn || alarm.AlarmName,
        resourceName: alarm.AlarmName,
        resourceType: 'CloudWatch_Alarm',
        region,
        state: alarm.StateValue || 'unknown',
        tags: {}, // Tags available in alarm object but not in this response
        metadata: {
          alarmDescription: alarm.AlarmDescription,
          actionsEnabled: alarm.ActionsEnabled,
          okActions: alarm.OKActions,
          alarmActions: alarm.AlarmActions,
          insufficientDataActions: alarm.InsufficientDataActions,
          stateReason: alarm.StateReason,
          stateReasonData: alarm.StateReasonData,
          stateUpdatedTimestamp: alarm.StateUpdatedTimestamp?.toISOString(),
          metricName: alarm.MetricName,
          namespace: alarm.Namespace,
          statistic: alarm.Statistic,
          extendedStatistic: alarm.ExtendedStatistic,
          dimensions: alarm.Dimensions?.map(d => ({
            name: d.Name,
            value: d.Value,
          })),
          period: alarm.Period,
          unit: alarm.Unit,
          evaluationPeriods: alarm.EvaluationPeriods,
          datapointsToAlarm: alarm.DatapointsToAlarm,
          threshold: alarm.Threshold,
          comparisonOperator: alarm.ComparisonOperator,
          treatMissingData: alarm.TreatMissingData,
          evaluateLowSampleCountPercentile: alarm.EvaluateLowSampleCountPercentile,
        },
      });
    }
  }

  console.log('Scanned CloudWatch Alarms', { region, count: resources.length });
  return resources;
}

/**
 * Scan CloudWatch Metrics (sample only)
 * Note: This returns a sample of metrics to avoid excessive API calls
 * In production, you might want to filter by specific namespaces
 */
async function scanMetrics(
  cwClient: CloudWatchClient,
  region: string
): Promise<Resource[]> {
  // Only get metrics from common namespaces to limit results
  const namespaces = ['AWS/EC2', 'AWS/RDS', 'AWS/Lambda', 'AWS/ELB'];
  const resources: Resource[] = [];

  for (const namespace of namespaces) {
    try {
      const command = new ListMetricsCommand({
        Namespace: namespace,
        // Note: ListMetrics doesn't have MaxRecords, it uses pagination
      });
      const response = await cwClient.send(command);

      if (response.Metrics) {
        // Limit to first 10 metrics per namespace
        const limitedMetrics = response.Metrics.slice(0, 10);
        
        for (const metric of limitedMetrics) {
          if (!metric.MetricName) continue;

          const metricId = `${namespace}/${metric.MetricName}`;
          
          resources.push({
            resourceId: metricId,
            resourceName: metric.MetricName,
            resourceType: 'CloudWatch_Alarm', // Using Alarm type for metrics
            region,
            state: 'active',
            tags: {},
            metadata: {
              namespace: metric.Namespace,
              dimensions: metric.Dimensions?.map(d => ({
                name: d.Name,
                value: d.Value,
              })),
              isMetric: true,
            },
          });
        }
      }
    } catch (error) {
      console.warn('Failed to list metrics for namespace', { namespace, error });
    }
  }

  console.log('Scanned CloudWatch Metrics (sample)', { region, count: resources.length });
  return resources;
}

/**
 * Create a scan error object
 */
function createScanError(service: string, region: string, error: unknown): ScanError {
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  console.error('Scan error', { service, region, error: message });
  
  return {
    type: 'scan_error',
    service,
    region,
    message,
    timestamp: new Date().toISOString(),
  };
}

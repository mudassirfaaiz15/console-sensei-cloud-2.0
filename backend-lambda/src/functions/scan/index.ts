import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ScanEvent, ScanResult, Resource, ScanError } from '../../types';
import { successResponse, internalErrorResponse, badRequestResponse } from '../../utils/response';
import { createAWSClients, assumeRoleAndCreateClients, createRegionalClients } from '../../utils/aws-clients';
import { discoverEnabledRegions } from '../../utils/region-discovery';
import { scanEC2Resources } from '../../scanners/ec2-scanner';
import { scanS3Resources } from '../../scanners/s3-scanner';
import { scanRDSResources } from '../../scanners/rds-scanner';
import { scanLambdaResources } from '../../scanners/lambda-scanner';
import { scanNetworkingResources } from '../../scanners/networking-scanner';
import { scanIAMResources } from '../../scanners/iam-scanner';
import { scanCloudWatchResources } from '../../scanners/cloudwatch-scanner';
import { scanCostData } from '../../scanners/cost-scanner';
import { storeScanResult } from '../../utils/dynamodb';

/**
 * Scan Lambda Handler
 * 
 * Orchestrates AWS resource scanning across all regions
 * 
 * Requirements:
 * - 2.5: Implement cross-account IAM role assumption using STS AssumeRole
 * - 3.1: Discover all enabled AWS regions
 * 
 * @param event - API Gateway event or direct invocation event
 * @param context - Lambda context
 * @returns API Gateway response with scan results
 */
export const handler = async (
  event: APIGatewayProxyEvent | ScanEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Scan Lambda invoked', { 
    requestId: context.awsRequestId,
    eventType: 'httpMethod' in event ? 'API Gateway' : 'Direct'
  });

  try {
    // Parse input
    const scanEvent = parseEvent(event);
    
    // Validate input
    if (!scanEvent.userId) {
      return badRequestResponse('userId is required', undefined, context.awsRequestId);
    }

    console.log('Starting scan', { 
      userId: scanEvent.userId, 
      roleArn: scanEvent.roleArn,
      requestedRegions: scanEvent.regions 
    });

    // Create AWS clients (with or without AssumeRole)
    const clients = scanEvent.roleArn
      ? await assumeRoleAndCreateClients(scanEvent.roleArn, scanEvent.userId)
      : createAWSClients();

    console.log('AWS clients created', { 
      assumedRole: !!scanEvent.roleArn 
    });

    // Discover enabled regions
    const regions = scanEvent.regions && scanEvent.regions.length > 0
      ? scanEvent.regions
      : await discoverEnabledRegions(clients);

    console.log('Regions to scan', { 
      count: regions.length, 
      regions 
    });

    // Initialize scan result
    const scanId = generateScanId();
    const timestamp = new Date().toISOString();
    const resources: Resource[] = [];
    const errors: ScanError[] = [];

    // Scan EC2 resources in all regions (Task 2.2)
    console.log('Starting EC2 resource scanning across regions');
    
    // Get temporary credentials if using AssumeRole
    const credentials = scanEvent.roleArn
      ? await getTemporaryCredentials(scanEvent.roleArn, scanEvent.userId)
      : undefined;

    // Scan each region concurrently
    const scanPromises = regions.map(async (region: string) => {
      const regionalResources: Resource[] = [];
      const regionalErrors: ScanError[] = [];

      try {
        const regionalClient = createRegionalClients(region, credentials);
        
        // Scan EC2 resources (Task 2.2)
        try {
          const ec2Result = await scanEC2Resources(regionalClient.ec2, region);
          regionalResources.push(...ec2Result.resources);
          regionalErrors.push(...ec2Result.errors);
        } catch (error) {
          regionalErrors.push(createScanError('EC2', region, error));
        }

        // Scan RDS and database resources (Task 2.4)
        try {
          const rdsResult = await scanRDSResources(
            regionalClient.rds,
            regionalClient.dynamodb,
            region
          );
          regionalResources.push(...rdsResult.resources);
          regionalErrors.push(...rdsResult.errors);
        } catch (error) {
          regionalErrors.push(createScanError('RDS', region, error));
        }

        // Scan Lambda and compute resources (Task 2.5)
        try {
          const lambdaResult = await scanLambdaResources(
            regionalClient.lambda,
            regionalClient.ecs,
            regionalClient.eks,
            region
          );
          regionalResources.push(...lambdaResult.resources);
          regionalErrors.push(...lambdaResult.errors);
        } catch (error) {
          regionalErrors.push(createScanError('Lambda', region, error));
        }

        // Scan networking resources (Task 2.6)
        try {
          const networkingResult = await scanNetworkingResources(
            regionalClient.elb,
            regionalClient.ec2,
            region
          );
          regionalResources.push(...networkingResult.resources);
          regionalErrors.push(...networkingResult.errors);
        } catch (error) {
          regionalErrors.push(createScanError('Networking', region, error));
        }

        // Scan CloudWatch resources (Task 2.8)
        try {
          const cloudwatchResult = await scanCloudWatchResources(
            regionalClient.cloudwatch,
            regionalClient.cloudwatchLogs,
            region
          );
          regionalResources.push(...cloudwatchResult.resources);
          regionalErrors.push(...cloudwatchResult.errors);
        } catch (error) {
          regionalErrors.push(createScanError('CloudWatch', region, error));
        }

      } catch (error) {
        console.error('Failed to scan region', { region, error });
        regionalErrors.push(createScanError('Region', region, error));
      }

      return { resources: regionalResources, errors: regionalErrors };
    });

    const scanResults = await Promise.all(scanPromises);

    // Aggregate results from all regions
    for (const result of scanResults) {
      resources.push(...result.resources);
      errors.push(...result.errors);
    }

    // Scan S3 resources (global service) (Task 2.3)
    console.log('Starting S3 resource scanning (global service)');
    try {
      // S3 is global, so we use the main S3 client (us-east-1)
      const s3Result = await scanS3Resources(clients.s3);
      resources.push(...s3Result.resources);
      errors.push(...s3Result.errors);
      
      console.log('S3 scan completed', {
        bucketCount: s3Result.resources.length,
        errorCount: s3Result.errors.length,
      });
    } catch (error) {
      console.error('Failed to scan S3', { error });
      errors.push(createScanError('S3', 'global', error));
    }

    // Scan IAM resources (global service) (Task 2.7)
    console.log('Starting IAM resource scanning (global service)');
    try {
      const iamResult = await scanIAMResources(clients.iam);
      resources.push(...iamResult.resources);
      errors.push(...iamResult.errors);
      
      console.log('IAM scan completed', {
        resourceCount: iamResult.resources.length,
        errorCount: iamResult.errors.length,
      });
    } catch (error) {
      console.error('Failed to scan IAM', { error });
      errors.push(createScanError('IAM', 'global', error));
    }

    // Scan cost data (global service) (Task 2.9)
    console.log('Starting cost data scanning (global service)');
    let costData;
    try {
      const costResult = await scanCostData(clients.costExplorer);
      costData = costResult.costData;
      errors.push(...costResult.errors);
      
      console.log('Cost scan completed', {
        totalCost: costData.estimatedMonthly,
        errorCount: costResult.errors.length,
      });
    } catch (error) {
      console.error('Failed to scan costs', { error });
      errors.push(createScanError('CostExplorer', 'global', error));
    }

    // Calculate summary
    const summary = calculateSummary(resources);

    console.log('Scan completed', { 
      scanId, 
      resourceCount: resources.length,
      errorCount: errors.length,
      summary,
    });

    const scanResult: ScanResult = {
      scanId,
      userId: scanEvent.userId,
      timestamp,
      resources,
      summary,
      costData,
      errors,
    };

    // Store scan result in DynamoDB (Task 2.11)
    try {
      await storeScanResult(scanResult);
      console.log('Scan result persisted to DynamoDB', { scanId });
    } catch (error) {
      console.error('Failed to store scan result in DynamoDB', { scanId, error });
      // Don't fail the entire scan if storage fails - log and continue
      errors.push({
        type: 'storage_error',
        service: 'DynamoDB',
        region: 'global',
        message: `Failed to persist scan result: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      });
    }

    return successResponse(scanResult, 200);

  } catch (error) {
    console.error('Error in Scan Lambda:', error);
    return internalErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      context.awsRequestId
    );
  }
};

/**
 * Parse event from API Gateway or direct invocation
 */
function parseEvent(event: APIGatewayProxyEvent | ScanEvent): ScanEvent {
  if ('httpMethod' in event) {
    // API Gateway event
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Extract userId from authorizer context (will be set by Cognito authorizer)
    const userId = event.requestContext?.authorizer?.claims?.sub || body.userId;
    
    return {
      userId,
      roleArn: body.roleArn,
      regions: body.regions,
    };
  } else {
    // Direct invocation
    return event;
  }
}

/**
 * Generate unique scan ID
 */
function generateScanId(): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `scan_${timestamp}_${random}`;
}

/**
 * Get temporary credentials from AssumeRole
 */
async function getTemporaryCredentials(roleArn: string, sessionName: string) {
  const { STSClient, AssumeRoleCommand } = await import('@aws-sdk/client-sts');
  
  const stsClient = new STSClient({ region: 'us-east-1' });
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `consolesensei-${sessionName}`,
    DurationSeconds: 3600,
  });

  const response = await stsClient.send(command);

  if (!response.Credentials) {
    throw new Error('AssumeRole did not return credentials');
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId!,
    secretAccessKey: response.Credentials.SecretAccessKey!,
    sessionToken: response.Credentials.SessionToken,
  };
}

/**
 * Calculate summary statistics from resources
 */
function calculateSummary(resources: Resource[]) {
  const byType: Record<string, number> = {};
  const byRegion: Record<string, number> = {};

  for (const resource of resources) {
    // Count by type
    byType[resource.resourceType] = (byType[resource.resourceType] || 0) + 1;
    
    // Count by region
    byRegion[resource.region] = (byRegion[resource.region] || 0) + 1;
  }

  return {
    totalResources: resources.length,
    byType,
    byRegion,
  };
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

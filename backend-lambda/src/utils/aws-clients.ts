import { STSClient, AssumeRoleCommand, AssumeRoleCommandOutput } from '@aws-sdk/client-sts';
import { EC2Client } from '@aws-sdk/client-ec2';
import { S3Client } from '@aws-sdk/client-s3';
import { RDSClient } from '@aws-sdk/client-rds';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { IAMClient } from '@aws-sdk/client-iam';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { ECSClient } from '@aws-sdk/client-ecs';
import { EKSClient } from '@aws-sdk/client-eks';
import { 
  ElasticLoadBalancingV2Client 
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { CostExplorerClient } from '@aws-sdk/client-cost-explorer';

/**
 * AWS SDK Clients for resource scanning
 * 
 * Requirements:
 * - 2.5: Implement cross-account IAM role assumption using STS AssumeRole
 * - 3.1-3.8: Set up AWS SDK clients for all services
 */

export interface AWSClients {
  sts: STSClient;
  ec2: EC2Client;
  s3: S3Client;
  rds: RDSClient;
  dynamodb: DynamoDBClient;
  lambda: LambdaClient;
  iam: IAMClient;
  cloudwatch: CloudWatchClient;
  cloudwatchLogs: CloudWatchLogsClient;
  ecs: ECSClient;
  eks: EKSClient;
  elb: ElasticLoadBalancingV2Client;
  costExplorer: CostExplorerClient;
}

export interface RegionalClients {
  ec2: EC2Client;
  rds: RDSClient;
  dynamodb: DynamoDBClient;
  lambda: LambdaClient;
  cloudwatch: CloudWatchClient;
  cloudwatchLogs: CloudWatchLogsClient;
  ecs: ECSClient;
  eks: EKSClient;
  elb: ElasticLoadBalancingV2Client;
}

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * Create AWS SDK clients with default credentials
 * Uses the Lambda execution role credentials
 */
export function createAWSClients(region: string = 'us-east-1'): AWSClients {
  return {
    sts: new STSClient({ region }),
    ec2: new EC2Client({ region }),
    s3: new S3Client({ region }),
    rds: new RDSClient({ region }),
    dynamodb: new DynamoDBClient({ region }),
    lambda: new LambdaClient({ region }),
    iam: new IAMClient({ region }),
    cloudwatch: new CloudWatchClient({ region }),
    cloudwatchLogs: new CloudWatchLogsClient({ region }),
    ecs: new ECSClient({ region }),
    eks: new EKSClient({ region }),
    elb: new ElasticLoadBalancingV2Client({ region }),
    costExplorer: new CostExplorerClient({ region }),
  };
}

/**
 * Create regional AWS SDK clients for multi-region scanning
 * 
 * @param region - AWS region
 * @param credentials - Optional temporary credentials from AssumeRole
 */
export function createRegionalClients(
  region: string,
  credentials?: AWSCredentials
): RegionalClients {
  const config = credentials
    ? { region, credentials }
    : { region };

  return {
    ec2: new EC2Client(config),
    rds: new RDSClient(config),
    dynamodb: new DynamoDBClient(config),
    lambda: new LambdaClient(config),
    cloudwatch: new CloudWatchClient(config),
    cloudwatchLogs: new CloudWatchLogsClient(config),
    ecs: new ECSClient(config),
    eks: new EKSClient(config),
    elb: new ElasticLoadBalancingV2Client(config),
  };
}

/**
 * Assume an IAM role for cross-account access and create AWS clients
 * 
 * Requirements:
 * - 2.5: Implement cross-account IAM role assumption using STS AssumeRole
 * - 2.6: Never store or log AWS root credentials
 * 
 * @param roleArn - ARN of the IAM role to assume
 * @param sessionName - Session name for the assumed role
 * @param region - AWS region for clients
 * @returns AWS clients with assumed role credentials
 */
export async function assumeRoleAndCreateClients(
  roleArn: string,
  sessionName: string,
  region: string = 'us-east-1'
): Promise<AWSClients> {
  console.log('Assuming IAM role', { 
    roleArn, 
    sessionName,
    // Never log credentials
  });

  const stsClient = new STSClient({ region });

  try {
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `consolesensei-${sessionName}`,
      DurationSeconds: 3600, // 1 hour
    });

    const response: AssumeRoleCommandOutput = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('AssumeRole did not return credentials');
    }

    const credentials: AWSCredentials = {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken,
    };

    console.log('Successfully assumed role', {
      roleArn,
      expiration: response.Credentials.Expiration,
      // Never log credentials
    });

    // Create clients with assumed role credentials
    return {
      sts: new STSClient({ region, credentials }),
      ec2: new EC2Client({ region, credentials }),
      s3: new S3Client({ region, credentials }),
      rds: new RDSClient({ region, credentials }),
      dynamodb: new DynamoDBClient({ region, credentials }),
      lambda: new LambdaClient({ region, credentials }),
      iam: new IAMClient({ region, credentials }),
      cloudwatch: new CloudWatchClient({ region, credentials }),
      cloudwatchLogs: new CloudWatchLogsClient({ region, credentials }),
      ecs: new ECSClient({ region, credentials }),
      eks: new EKSClient({ region, credentials }),
      elb: new ElasticLoadBalancingV2Client({ region, credentials }),
      costExplorer: new CostExplorerClient({ region, credentials }),
    };
  } catch (error) {
    console.error('Failed to assume role', { 
      roleArn, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error(`Failed to assume role ${roleArn}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract temporary credentials from AssumeRole response
 * Used for creating regional clients
 */
export function extractCredentials(clients: AWSClients): AWSCredentials | undefined {
  // If clients were created with assumed role, we need to extract credentials
  // This is a workaround since AWS SDK doesn't expose credentials directly
  // In practice, we'll pass credentials separately when needed
  return undefined;
}

// AWS Client Factory
// Creates AWS SDK clients with stored credentials

import { CostExplorerClient } from '@aws-sdk/client-cost-explorer';
import { EC2Client } from '@aws-sdk/client-ec2';
import { S3Client } from '@aws-sdk/client-s3';
import { IAMClient } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { getCredentials, getRegion, type AWSCredentials } from './credentials';

/**
 * Create AWS credentials config from stored credentials
 */
function getCredentialsConfig() {
    const creds = getCredentials();
    if (!creds) {
        throw new Error('AWS credentials not configured');
    }

    return {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
    };
}

/**
 * Create Cost Explorer client
 */
export function createCostExplorerClient(): CostExplorerClient {
    return new CostExplorerClient({
        region: 'us-east-1', // Cost Explorer is only available in us-east-1
        credentials: getCredentialsConfig(),
    });
}

/**
 * Create EC2 client
 */
export function createEC2Client(region?: string): EC2Client {
    return new EC2Client({
        region: region || getRegion(),
        credentials: getCredentialsConfig(),
    });
}

/**
 * Create S3 client
 */
export function createS3Client(region?: string): S3Client {
    return new S3Client({
        region: region || getRegion(),
        credentials: getCredentialsConfig(),
    });
}

/**
 * Create IAM client
 */
export function createIAMClient(): IAMClient {
    return new IAMClient({
        region: 'us-east-1', // IAM is global
        credentials: getCredentialsConfig(),
    });
}

/**
 * Create STS client
 */
export function createSTSClient(): STSClient {
    return new STSClient({
        region: getRegion(),
        credentials: getCredentialsConfig(),
    });
}

/**
 * Test AWS connection and get account info
 */
export async function testConnection(credentials: AWSCredentials): Promise<{
    success: boolean;
    accountId?: string;
    arn?: string;
    error?: string;
}> {
    try {
        const client = new STSClient({
            region: credentials.region || 'us-east-1',
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey,
            },
        });

        const response = await client.send(new GetCallerIdentityCommand({}));

        return {
            success: true,
            accountId: response.Account,
            arn: response.Arn,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}

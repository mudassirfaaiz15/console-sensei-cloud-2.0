import {
  ListBucketsCommand,
  GetBucketLocationCommand,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Resource, ScanError } from '../types';

/**
 * S3 Resource Scanner
 * 
 * Requirements:
 * - 3.3: Scan S3 buckets with size, encryption status, and public access configuration
 * 
 * Note: S3 is a global service, but buckets have regions.
 * We need to query each bucket's region and configuration individually.
 */

export interface S3ScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all S3 buckets (global service)
 * 
 * @param s3Client - S3 client (can use any region, but us-east-1 is typical)
 * @returns S3 bucket resources and errors
 */
export async function scanS3Resources(
  s3Client: S3Client
): Promise<S3ScanResult> {
  console.log('Scanning S3 buckets (global service)');

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  try {
    // List all buckets (global operation)
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Buckets || listResponse.Buckets.length === 0) {
      console.log('No S3 buckets found');
      return { resources, errors };
    }

    console.log('Found S3 buckets', { count: listResponse.Buckets.length });

    // Scan each bucket individually
    for (const bucket of listResponse.Buckets) {
      if (!bucket.Name) continue;

      try {
        const bucketResource = await scanBucket(s3Client, bucket.Name, bucket.CreationDate);
        resources.push(bucketResource);
      } catch (error) {
        errors.push(createScanError('S3_Bucket', bucket.Name, error));
      }
    }

    console.log('S3 scan completed', {
      resourceCount: resources.length,
      errorCount: errors.length,
    });

  } catch (error) {
    errors.push(createScanError('S3_ListBuckets', 'global', error));
  }

  return { resources, errors };
}

/**
 * Scan individual S3 bucket with metadata
 */
async function scanBucket(
  s3Client: S3Client,
  bucketName: string,
  creationDate?: Date
): Promise<Resource> {
  console.log('Scanning bucket', { bucketName });

  // Get bucket region
  const region = await getBucketRegion(s3Client, bucketName);

  // Get bucket encryption status
  const encryption = await getBucketEncryption(s3Client, bucketName);

  // Get public access configuration
  const publicAccess = await getPublicAccessBlock(s3Client, bucketName);

  // Get bucket tags
  const tags = await getBucketTags(s3Client, bucketName);

  // Note: Getting bucket size requires CloudWatch metrics or iterating all objects
  // For now, we'll leave size as undefined to avoid performance issues
  // This can be enhanced later with CloudWatch integration

  return {
    resourceId: bucketName,
    resourceName: bucketName,
    resourceType: 'S3_Bucket',
    region,
    state: 'active',
    creationDate: creationDate?.toISOString(),
    tags,
    metadata: {
      encryption: encryption,
      publicAccessBlock: publicAccess,
      // size: undefined, // Would require CloudWatch or object iteration
    },
  };
}

/**
 * Get bucket region
 */
async function getBucketRegion(
  s3Client: S3Client,
  bucketName: string
): Promise<string> {
  try {
    const command = new GetBucketLocationCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);
    
    // LocationConstraint is null for us-east-1
    return response.LocationConstraint || 'us-east-1';
  } catch (error) {
    console.warn('Failed to get bucket region', { bucketName, error });
    return 'unknown';
  }
}

/**
 * Get bucket encryption configuration
 */
async function getBucketEncryption(
  s3Client: S3Client,
  bucketName: string
): Promise<{
  enabled: boolean;
  algorithm?: string;
  kmsMasterKeyId?: string;
}> {
  try {
    const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);

    if (response.ServerSideEncryptionConfiguration?.Rules) {
      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      const defaultEncryption = rule?.ApplyServerSideEncryptionByDefault;

      return {
        enabled: true,
        algorithm: defaultEncryption?.SSEAlgorithm,
        kmsMasterKeyId: defaultEncryption?.KMSMasterKeyID,
      };
    }

    return { enabled: false };
  } catch (error: any) {
    // ServerSideEncryptionConfigurationNotFoundError means no encryption
    if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
      return { enabled: false };
    }
    
    console.warn('Failed to get bucket encryption', { bucketName, error });
    return { enabled: false };
  }
}

/**
 * Get public access block configuration
 */
async function getPublicAccessBlock(
  s3Client: S3Client,
  bucketName: string
): Promise<{
  blockPublicAcls?: boolean;
  ignorePublicAcls?: boolean;
  blockPublicPolicy?: boolean;
  restrictPublicBuckets?: boolean;
  isPublic: boolean;
}> {
  try {
    const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);

    const config = response.PublicAccessBlockConfiguration;

    // Bucket is considered public if any of these are false
    const isPublic = !(
      config?.BlockPublicAcls &&
      config?.IgnorePublicAcls &&
      config?.BlockPublicPolicy &&
      config?.RestrictPublicBuckets
    );

    return {
      blockPublicAcls: config?.BlockPublicAcls,
      ignorePublicAcls: config?.IgnorePublicAcls,
      blockPublicPolicy: config?.BlockPublicPolicy,
      restrictPublicBuckets: config?.RestrictPublicBuckets,
      isPublic,
    };
  } catch (error: any) {
    // NoSuchPublicAccessBlockConfiguration means no block is configured (potentially public)
    if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
      return {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
        isPublic: true,
      };
    }

    console.warn('Failed to get public access block', { bucketName, error });
    return {
      isPublic: true, // Assume public if we can't determine
    };
  }
}

/**
 * Get bucket tags
 */
async function getBucketTags(
  s3Client: S3Client,
  bucketName: string
): Promise<Record<string, string>> {
  try {
    const command = new GetBucketTaggingCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);

    const tags: Record<string, string> = {};

    if (response.TagSet) {
      for (const tag of response.TagSet) {
        if (tag.Key && tag.Value !== undefined) {
          tags[tag.Key] = tag.Value;
        }
      }
    }

    return tags;
  } catch (error: any) {
    // NoSuchTagSet means no tags configured
    if (error.name === 'NoSuchTagSet') {
      return {};
    }

    console.warn('Failed to get bucket tags', { bucketName, error });
    return {};
  }
}

/**
 * Create a scan error object
 */
function createScanError(service: string, resource: string, error: unknown): ScanError {
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  console.error('Scan error', { service, resource, error: message });
  
  return {
    type: 'scan_error',
    service,
    region: 'global',
    message: `${resource}: ${message}`,
    timestamp: new Date().toISOString(),
  };
}

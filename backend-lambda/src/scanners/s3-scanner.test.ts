import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';
import { scanS3Resources } from './s3-scanner';
import { mockClient } from 'aws-sdk-client-mock';
import {
  ListBucketsCommand,
  GetBucketLocationCommand,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';

const s3Mock = mockClient(S3Client);

describe('S3 Scanner', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  describe('scanS3Resources', () => {
    it('should return empty arrays when no buckets exist', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [],
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should scan a bucket with encryption enabled', async () => {
      const creationDate = new Date('2024-01-01T00:00:00Z');

      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [
          {
            Name: 'test-bucket',
            CreationDate: creationDate,
          },
        ],
      });

      s3Mock.on(GetBucketLocationCommand).resolves({
        LocationConstraint: 'us-west-2',
      });

      s3Mock.on(GetBucketEncryptionCommand).resolves({
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        },
      });

      s3Mock.on(GetBucketTaggingCommand).resolves({
        TagSet: [
          { Key: 'Environment', Value: 'production' },
          { Key: 'Owner', Value: 'team-a' },
        ],
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      const bucket = result.resources[0];
      expect(bucket.resourceId).toBe('test-bucket');
      expect(bucket.resourceName).toBe('test-bucket');
      expect(bucket.resourceType).toBe('S3_Bucket');
      expect(bucket.region).toBe('us-west-2');
      expect(bucket.state).toBe('active');
      expect(bucket.creationDate).toBe(creationDate.toISOString());
      expect(bucket.tags).toEqual({
        Environment: 'production',
        Owner: 'team-a',
      });
      expect(bucket.metadata.encryption).toEqual({
        enabled: true,
        algorithm: 'AES256',
      });
      expect(bucket.metadata.publicAccessBlock).toEqual({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
        isPublic: false,
      });
    });

    it('should detect bucket without encryption', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'unencrypted-bucket' }],
      });

      s3Mock.on(GetBucketLocationCommand).resolves({
        LocationConstraint: null, // us-east-1
      });

      s3Mock.on(GetBucketEncryptionCommand).rejects({
        name: 'ServerSideEncryptionConfigurationNotFoundError',
        message: 'No encryption configuration',
      });

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        },
      });

      s3Mock.on(GetBucketTaggingCommand).rejects({
        name: 'NoSuchTagSet',
        message: 'No tags',
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      const bucket = result.resources[0];
      expect(bucket.region).toBe('us-east-1');
      expect(bucket.metadata.encryption.enabled).toBe(false);
      expect(bucket.tags).toEqual({});
    });

    it('should detect public bucket', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'public-bucket' }],
      });

      s3Mock.on(GetBucketLocationCommand).resolves({
        LocationConstraint: 'eu-west-1',
      });

      s3Mock.on(GetBucketEncryptionCommand).rejects({
        name: 'ServerSideEncryptionConfigurationNotFoundError',
      });

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          IgnorePublicAcls: false,
          BlockPublicPolicy: false,
          RestrictPublicBuckets: false,
        },
      });

      s3Mock.on(GetBucketTaggingCommand).rejects({
        name: 'NoSuchTagSet',
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(1);
      const bucket = result.resources[0];
      expect(bucket.metadata.publicAccessBlock.isPublic).toBe(true);
    });

    it('should detect bucket with no public access block configured', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'no-block-bucket' }],
      });

      s3Mock.on(GetBucketLocationCommand).resolves({
        LocationConstraint: 'ap-southeast-1',
      });

      s3Mock.on(GetBucketEncryptionCommand).rejects({
        name: 'ServerSideEncryptionConfigurationNotFoundError',
      });

      s3Mock.on(GetPublicAccessBlockCommand).rejects({
        name: 'NoSuchPublicAccessBlockConfiguration',
        message: 'No public access block',
      });

      s3Mock.on(GetBucketTaggingCommand).rejects({
        name: 'NoSuchTagSet',
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(1);
      const bucket = result.resources[0];
      expect(bucket.metadata.publicAccessBlock.isPublic).toBe(true);
      expect(bucket.metadata.publicAccessBlock.blockPublicAcls).toBe(false);
    });

    it('should scan multiple buckets', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [
          { Name: 'bucket-1' },
          { Name: 'bucket-2' },
          { Name: 'bucket-3' },
        ],
      });

      s3Mock.on(GetBucketLocationCommand).resolves({
        LocationConstraint: 'us-east-1',
      });

      s3Mock.on(GetBucketEncryptionCommand).resolves({
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: 'arn:aws:kms:us-east-1:123456789012:key/12345678',
              },
            },
          ],
        },
      });

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        },
      });

      s3Mock.on(GetBucketTaggingCommand).rejects({
        name: 'NoSuchTagSet',
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.resources[0].resourceName).toBe('bucket-1');
      expect(result.resources[1].resourceName).toBe('bucket-2');
      expect(result.resources[2].resourceName).toBe('bucket-3');
    });

    it('should handle individual bucket scan errors gracefully', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [
          { Name: 'good-bucket' },
          { Name: 'bad-bucket' },
        ],
      });

      s3Mock
        .on(GetBucketLocationCommand, { Bucket: 'good-bucket' })
        .resolves({ LocationConstraint: 'us-east-1' });

      s3Mock
        .on(GetBucketLocationCommand, { Bucket: 'bad-bucket' })
        .rejects(new Error('Access Denied'));

      s3Mock.on(GetBucketEncryptionCommand).rejects({
        name: 'ServerSideEncryptionConfigurationNotFoundError',
      });

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        },
      });

      s3Mock.on(GetBucketTaggingCommand).rejects({
        name: 'NoSuchTagSet',
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      // Both buckets should be scanned, but bad-bucket will have region 'unknown'
      expect(result.resources).toHaveLength(2);
      expect(result.resources[0].resourceName).toBe('good-bucket');
      expect(result.resources[0].region).toBe('us-east-1');
      expect(result.resources[1].resourceName).toBe('bad-bucket');
      expect(result.resources[1].region).toBe('unknown');
      expect(result.errors).toHaveLength(0); // No errors since we handle region failure gracefully
    });

    it('should handle ListBuckets failure', async () => {
      s3Mock.on(ListBucketsCommand).rejects(new Error('Permission denied'));

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].service).toBe('S3_ListBuckets');
      expect(result.errors[0].message).toContain('Permission denied');
    });

    it('should handle bucket with KMS encryption', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'kms-bucket' }],
      });

      s3Mock.on(GetBucketLocationCommand).resolves({
        LocationConstraint: 'us-west-2',
      });

      s3Mock.on(GetBucketEncryptionCommand).resolves({
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: 'arn:aws:kms:us-west-2:123456789012:key/abcd-1234',
              },
            },
          ],
        },
      });

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        },
      });

      s3Mock.on(GetBucketTaggingCommand).rejects({
        name: 'NoSuchTagSet',
      });

      const s3Client = new S3Client({ region: 'us-east-1' });
      const result = await scanS3Resources(s3Client);

      expect(result.resources).toHaveLength(1);
      const bucket = result.resources[0];
      expect(bucket.metadata.encryption).toEqual({
        enabled: true,
        algorithm: 'aws:kms',
        kmsMasterKeyId: 'arn:aws:kms:us-west-2:123456789012:key/abcd-1234',
      });
    });
  });
});

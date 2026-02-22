import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './index';
import { Context } from 'aws-lambda';
import * as awsClients from '../../utils/aws-clients';
import * as regionDiscovery from '../../utils/region-discovery';
import * as ec2Scanner from '../../scanners/ec2-scanner';
import * as s3Scanner from '../../scanners/s3-scanner';

// Mock the AWS clients and region discovery
vi.mock('../../utils/aws-clients');
vi.mock('../../utils/region-discovery');
vi.mock('../../scanners/ec2-scanner');
vi.mock('../../scanners/s3-scanner');

describe('Scan Lambda Handler - Task 2.1', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'scan-lambda',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:scan-lambda',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/scan-lambda',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Handler function with event/context parameters', () => {
    it('should accept API Gateway event and return response', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      const apiGatewayEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({ userId: 'test-user-123' }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-123',
            },
          },
        },
      } as any;

      // Act
      const result = await handler(apiGatewayEvent, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('scanId');
      expect(body.data).toHaveProperty('userId', 'test-user-123');
      expect(body.data).toHaveProperty('timestamp');
      expect(body.data).toHaveProperty('resources');
      expect(body.data).toHaveProperty('summary');
    });

    it('should accept direct invocation event', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      const directEvent = {
        userId: 'test-user-456',
      };

      // Act
      const result = await handler(directEvent, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.userId).toBe('test-user-456');
    });

    it('should return 400 if userId is missing', async () => {
      // Arrange
      const apiGatewayEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({}),
        requestContext: {},
      } as any;

      // Act
      const result = await handler(apiGatewayEvent, mockContext);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('BAD_REQUEST');
    });
  });

  describe('AssumeRole for cross-account access', () => {
    it('should call assumeRoleAndCreateClients when roleArn is provided', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      const assumeRoleSpy = vi.mocked(awsClients.assumeRoleAndCreateClients)
        .mockResolvedValue(mockClients);
      
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      const event = {
        userId: 'test-user',
        roleArn: 'arn:aws:iam::123456789012:role/CrossAccountRole',
      };

      // Act
      await handler(event, mockContext);

      // Assert
      expect(assumeRoleSpy).toHaveBeenCalledWith(
        'arn:aws:iam::123456789012:role/CrossAccountRole',
        'test-user'
      );
    });

    it('should use default credentials when roleArn is not provided', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      const createClientsSpy = vi.mocked(awsClients.createAWSClients)
        .mockReturnValue(mockClients);
      
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      const event = {
        userId: 'test-user',
      };

      // Act
      await handler(event, mockContext);

      // Assert
      expect(createClientsSpy).toHaveBeenCalled();
      expect(awsClients.assumeRoleAndCreateClients).not.toHaveBeenCalled();
    });
  });

  describe('Region discovery using EC2 DescribeRegions', () => {
    it('should discover enabled regions when regions not specified', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      
      const discoverRegionsSpy = vi.mocked(regionDiscovery.discoverEnabledRegions)
        .mockResolvedValue(['us-east-1', 'us-west-2', 'eu-west-1']);

      const event = {
        userId: 'test-user',
      };

      // Act
      await handler(event, mockContext);

      // Assert
      expect(discoverRegionsSpy).toHaveBeenCalledWith(mockClients);
    });

    it('should use provided regions when specified', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      
      const discoverRegionsSpy = vi.mocked(regionDiscovery.discoverEnabledRegions);

      const event = {
        userId: 'test-user',
        regions: ['us-east-1', 'eu-west-1'],
      };

      // Act
      await handler(event, mockContext);

      // Assert
      expect(discoverRegionsSpy).not.toHaveBeenCalled();
    });
  });

  describe('AWS SDK clients setup', () => {
    it('should create AWS SDK clients for all services', async () => {
      // Arrange
      const mockClients = {
        sts: { send: vi.fn() },
        ec2: { send: vi.fn() },
        s3: { send: vi.fn() },
        rds: { send: vi.fn() },
        lambda: { send: vi.fn() },
        iam: { send: vi.fn() },
        cloudwatch: { send: vi.fn() },
        ecs: { send: vi.fn() },
        eks: { send: vi.fn() },
        elb: { send: vi.fn() },
        elbv2: { send: vi.fn() },
        costExplorer: { send: vi.fn() },
      } as any;

      const createClientsSpy = vi.mocked(awsClients.createAWSClients)
        .mockReturnValue(mockClients);
      
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      const event = {
        userId: 'test-user',
      };

      // Act
      await handler(event, mockContext);

      // Assert
      expect(createClientsSpy).toHaveBeenCalled();
      
      // Verify all required clients are present
      const clients = createClientsSpy.mock.results[0].value;
      expect(clients).toHaveProperty('sts');
      expect(clients).toHaveProperty('ec2');
      expect(clients).toHaveProperty('s3');
      expect(clients).toHaveProperty('rds');
      expect(clients).toHaveProperty('lambda');
      expect(clients).toHaveProperty('iam');
      expect(clients).toHaveProperty('cloudwatch');
      expect(clients).toHaveProperty('ecs');
      expect(clients).toHaveProperty('eks');
      expect(clients).toHaveProperty('elb');
      expect(clients).toHaveProperty('elbv2');
      expect(clients).toHaveProperty('costExplorer');
    });
  });

  describe('Error handling', () => {
    it('should return 500 on internal error', async () => {
      // Arrange
      vi.mocked(awsClients.createAWSClients).mockImplementation(() => {
        throw new Error('AWS SDK initialization failed');
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('INTERNAL_ERROR');
      expect(body.error?.details).toContain('AWS SDK initialization failed');
    });
  });

  describe('EC2 Resource Scanning - Task 2.2', () => {
    it('should scan EC2 resources across all regions', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue([
        'us-east-1',
        'us-west-2',
      ]);

      // Mock EC2 scanner to return sample resources
      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'i-12345',
            resourceName: 'WebServer',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: { Name: 'WebServer' },
            metadata: { instanceType: 't2.micro' },
          },
          {
            resourceId: 'vol-12345',
            resourceName: 'RootVolume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'in-use',
            tags: {},
            metadata: { size: 100, encrypted: true },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      // Should have scanned 2 regions
      expect(ec2Scanner.scanEC2Resources).toHaveBeenCalledTimes(2);
      
      // Should have aggregated resources from both regions
      expect(body.data.resources.length).toBeGreaterThan(0);
      expect(body.data.summary.totalResources).toBeGreaterThan(0);
      expect(body.data.summary.byType).toHaveProperty('EC2_Instance');
      expect(body.data.summary.byType).toHaveProperty('EBS_Volume');
      expect(body.data.summary.byRegion).toHaveProperty('us-east-1');
    });

    it('should scan EC2 instances with metadata', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'i-1234567890abcdef0',
            resourceName: 'WebServer',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: { Name: 'WebServer', Environment: 'Production' },
            metadata: {
              instanceType: 't2.micro',
              availabilityZone: 'us-east-1a',
              privateIpAddress: '10.0.1.10',
              publicIpAddress: '54.123.45.67',
              vpcId: 'vpc-12345',
              subnetId: 'subnet-12345',
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const instance = body.data.resources.find(
        (r: any) => r.resourceType === 'EC2_Instance'
      );
      expect(instance).toBeDefined();
      expect(instance.metadata.instanceType).toBe('t2.micro');
      expect(instance.metadata.privateIpAddress).toBe('10.0.1.10');
      expect(instance.tags.Environment).toBe('Production');
    });

    it('should scan EBS volumes with encryption status', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'vol-12345',
            resourceName: 'DataVolume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'in-use',
            tags: {},
            metadata: {
              size: 500,
              volumeType: 'gp3',
              encrypted: true,
              attachments: [
                {
                  instanceId: 'i-12345',
                  device: '/dev/sdf',
                  state: 'attached',
                },
              ],
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const volume = body.data.resources.find(
        (r: any) => r.resourceType === 'EBS_Volume'
      );
      expect(volume).toBeDefined();
      expect(volume.metadata.encrypted).toBe(true);
      expect(volume.metadata.size).toBe(500);
      expect(volume.metadata.attachments).toHaveLength(1);
    });

    it('should scan Elastic IPs with association status', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'eipalloc-12345',
            resourceName: 'WebServerEIP',
            resourceType: 'Elastic_IP',
            region: 'us-east-1',
            state: 'associated',
            tags: {},
            metadata: {
              publicIp: '54.123.45.67',
              associationId: 'eipassoc-12345',
              instanceId: 'i-12345',
            },
          },
          {
            resourceId: 'eipalloc-67890',
            resourceName: 'UnusedEIP',
            resourceType: 'Elastic_IP',
            region: 'us-east-1',
            state: 'unassociated',
            tags: {},
            metadata: {
              publicIp: '54.123.45.68',
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const eips = body.data.resources.filter(
        (r: any) => r.resourceType === 'Elastic_IP'
      );
      expect(eips).toHaveLength(2);
      
      const associatedEIP = eips.find((e: any) => e.state === 'associated');
      expect(associatedEIP.metadata.instanceId).toBe('i-12345');
      
      const unassociatedEIP = eips.find((e: any) => e.state === 'unassociated');
      expect(unassociatedEIP.metadata.instanceId).toBeUndefined();
    });

    it('should scan security groups with ingress/egress rules', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'sg-12345',
            resourceName: 'web-sg',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              vpcId: 'vpc-12345',
              ingressRules: [
                {
                  ipProtocol: 'tcp',
                  fromPort: 80,
                  toPort: 80,
                  ipRanges: ['0.0.0.0/0'],
                },
                {
                  ipProtocol: 'tcp',
                  fromPort: 22,
                  toPort: 22,
                  ipRanges: ['0.0.0.0/0'],
                },
              ],
              egressRules: [
                {
                  ipProtocol: '-1',
                  ipRanges: ['0.0.0.0/0'],
                },
              ],
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const sg = body.data.resources.find(
        (r: any) => r.resourceType === 'Security_Group'
      );
      expect(sg).toBeDefined();
      expect(sg.metadata.ingressRules).toHaveLength(2);
      expect(sg.metadata.egressRules).toHaveLength(1);
    });

    it('should scan VPCs and subnets', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'vpc-12345',
            resourceName: 'MainVPC',
            resourceType: 'VPC',
            region: 'us-east-1',
            state: 'available',
            tags: { Name: 'MainVPC' },
            metadata: {
              cidrBlock: '10.0.0.0/16',
              isDefault: false,
            },
          },
          {
            resourceId: 'subnet-12345',
            resourceName: 'PublicSubnet1',
            resourceType: 'Subnet',
            region: 'us-east-1',
            state: 'available',
            tags: {},
            metadata: {
              vpcId: 'vpc-12345',
              cidrBlock: '10.0.1.0/24',
              availabilityZone: 'us-east-1a',
              availableIpAddressCount: 250,
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const vpc = body.data.resources.find((r: any) => r.resourceType === 'VPC');
      expect(vpc).toBeDefined();
      expect(vpc.metadata.cidrBlock).toBe('10.0.0.0/16');
      
      const subnet = body.data.resources.find((r: any) => r.resourceType === 'Subnet');
      expect(subnet).toBeDefined();
      expect(subnet.metadata.vpcId).toBe('vpc-12345');
    });

    it('should handle errors in EC2 scanning and continue', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue([
        'us-east-1',
        'us-west-2',
      ]);

      // Mock one region succeeding and one failing
      vi.mocked(ec2Scanner.scanEC2Resources)
        .mockResolvedValueOnce({
          resources: [
            {
              resourceId: 'i-12345',
              resourceName: 'WebServer',
              resourceType: 'EC2_Instance',
              region: 'us-east-1',
              state: 'running',
              tags: {},
              metadata: {},
            },
          ],
          errors: [],
        })
        .mockResolvedValueOnce({
          resources: [],
          errors: [
            {
              type: 'scan_error',
              service: 'EC2_Instances',
              region: 'us-west-2',
              message: 'Access denied',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      // Should have resources from successful region
      expect(body.data.resources.length).toBeGreaterThan(0);
      
      // Should have errors from failed region
      expect(body.data.errors.length).toBeGreaterThan(0);
      // Find the EC2 error from us-west-2
      const ec2Error = body.data.errors.find(
        (e: any) => e.service === 'EC2_Instances' && e.region === 'us-west-2'
      );
      expect(ec2Error).toBeDefined();
      expect(ec2Error.region).toBe('us-west-2');
    });
  });

  describe('S3 Resource Scanning - Task 2.3', () => {
    beforeEach(() => {
      // Setup default mocks for EC2 scanner
      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [],
        errors: [],
      });
    });

    it('should scan S3 buckets (global service)', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'my-app-bucket',
            resourceName: 'my-app-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: { Environment: 'production' },
            metadata: {
              encryption: {
                enabled: true,
                algorithm: 'AES256',
              },
              publicAccessBlock: {
                blockPublicAcls: true,
                ignorePublicAcls: true,
                blockPublicPolicy: true,
                restrictPublicBuckets: true,
                isPublic: false,
              },
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      // Should have called S3 scanner
      expect(s3Scanner.scanS3Resources).toHaveBeenCalledWith(mockClients.s3);
      
      // Should have S3 bucket in resources
      const bucket = body.data.resources.find(
        (r: any) => r.resourceType === 'S3_Bucket'
      );
      expect(bucket).toBeDefined();
      expect(bucket.resourceId).toBe('my-app-bucket');
      expect(bucket.region).toBe('us-east-1');
    });

    it('should get bucket region for each bucket', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'us-east-bucket',
            resourceName: 'us-east-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: { enabled: false },
              publicAccessBlock: { isPublic: false },
            },
          },
          {
            resourceId: 'eu-west-bucket',
            resourceName: 'eu-west-bucket',
            resourceType: 'S3_Bucket',
            region: 'eu-west-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: { enabled: false },
              publicAccessBlock: { isPublic: false },
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const buckets = body.data.resources.filter(
        (r: any) => r.resourceType === 'S3_Bucket'
      );
      expect(buckets).toHaveLength(2);
      expect(buckets[0].region).toBe('us-east-1');
      expect(buckets[1].region).toBe('eu-west-1');
    });

    it('should get bucket encryption status', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'encrypted-bucket',
            resourceName: 'encrypted-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-west-2',
            state: 'active',
            tags: {},
            metadata: {
              encryption: {
                enabled: true,
                algorithm: 'aws:kms',
                kmsMasterKeyId: 'arn:aws:kms:us-west-2:123456789012:key/12345',
              },
              publicAccessBlock: { isPublic: false },
            },
          },
          {
            resourceId: 'unencrypted-bucket',
            resourceName: 'unencrypted-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: {
                enabled: false,
              },
              publicAccessBlock: { isPublic: false },
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const encryptedBucket = body.data.resources.find(
        (r: any) => r.resourceId === 'encrypted-bucket'
      );
      expect(encryptedBucket.metadata.encryption.enabled).toBe(true);
      expect(encryptedBucket.metadata.encryption.algorithm).toBe('aws:kms');
      
      const unencryptedBucket = body.data.resources.find(
        (r: any) => r.resourceId === 'unencrypted-bucket'
      );
      expect(unencryptedBucket.metadata.encryption.enabled).toBe(false);
    });

    it('should check public access configuration', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'private-bucket',
            resourceName: 'private-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: { enabled: true, algorithm: 'AES256' },
              publicAccessBlock: {
                blockPublicAcls: true,
                ignorePublicAcls: true,
                blockPublicPolicy: true,
                restrictPublicBuckets: true,
                isPublic: false,
              },
            },
          },
          {
            resourceId: 'public-bucket',
            resourceName: 'public-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: { enabled: false },
              publicAccessBlock: {
                blockPublicAcls: false,
                ignorePublicAcls: false,
                blockPublicPolicy: false,
                restrictPublicBuckets: false,
                isPublic: true,
              },
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const privateBucket = body.data.resources.find(
        (r: any) => r.resourceId === 'private-bucket'
      );
      expect(privateBucket.metadata.publicAccessBlock.isPublic).toBe(false);
      expect(privateBucket.metadata.publicAccessBlock.blockPublicAcls).toBe(true);
      
      const publicBucket = body.data.resources.find(
        (r: any) => r.resourceId === 'public-bucket'
      );
      expect(publicBucket.metadata.publicAccessBlock.isPublic).toBe(true);
      expect(publicBucket.metadata.publicAccessBlock.blockPublicAcls).toBe(false);
    });

    it('should get bucket tags', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'tagged-bucket',
            resourceName: 'tagged-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {
              Environment: 'production',
              Owner: 'team-a',
              Project: 'web-app',
            },
            metadata: {
              encryption: { enabled: true, algorithm: 'AES256' },
              publicAccessBlock: { isPublic: false },
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      const bucket = body.data.resources.find(
        (r: any) => r.resourceId === 'tagged-bucket'
      );
      expect(bucket.tags).toEqual({
        Environment: 'production',
        Owner: 'team-a',
        Project: 'web-app',
      });
    });

    it('should handle S3 scanning errors gracefully', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'accessible-bucket',
            resourceName: 'accessible-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: { enabled: true, algorithm: 'AES256' },
              publicAccessBlock: { isPublic: false },
            },
          },
        ],
        errors: [
          {
            type: 'scan_error',
            service: 'S3_Bucket',
            region: 'global',
            message: 'restricted-bucket: Access Denied',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      // Should have the accessible bucket
      expect(body.data.resources.length).toBe(1);
      expect(body.data.resources[0].resourceId).toBe('accessible-bucket');
      
      // Should have the error for the restricted bucket
      const s3Errors = body.data.errors.filter((e: any) => e.service === 'S3_Bucket');
      expect(s3Errors.length).toBe(1);
      expect(s3Errors[0].service).toBe('S3_Bucket');
      expect(s3Errors[0].message).toContain('restricted-bucket');
    });

    it('should aggregate S3 buckets with EC2 resources', async () => {
      // Arrange
      const mockClients = {
        ec2: {},
        s3: {},
        sts: {},
      } as any;

      vi.mocked(awsClients.createAWSClients).mockReturnValue(mockClients);
      vi.mocked(awsClients.createRegionalClients).mockReturnValue({
        ec2: {},
      } as any);
      vi.mocked(regionDiscovery.discoverEnabledRegions).mockResolvedValue(['us-east-1']);

      vi.mocked(ec2Scanner.scanEC2Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'i-12345',
            resourceName: 'WebServer',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {},
            metadata: {},
          },
        ],
        errors: [],
      });

      vi.mocked(s3Scanner.scanS3Resources).mockResolvedValue({
        resources: [
          {
            resourceId: 'my-bucket',
            resourceName: 'my-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              encryption: { enabled: true, algorithm: 'AES256' },
              publicAccessBlock: { isPublic: false },
            },
          },
        ],
        errors: [],
      });

      const event = {
        userId: 'test-user',
      };

      // Act
      const result = await handler(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      // Should have both EC2 and S3 resources
      expect(body.data.resources.length).toBe(2);
      expect(body.data.summary.totalResources).toBe(2);
      expect(body.data.summary.byType).toHaveProperty('EC2_Instance');
      expect(body.data.summary.byType).toHaveProperty('S3_Bucket');
      expect(body.data.summary.byType.EC2_Instance).toBe(1);
      expect(body.data.summary.byType.S3_Bucket).toBe(1);
    });
  });
});

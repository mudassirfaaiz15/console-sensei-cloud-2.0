import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { handler } from './index';
import { ScanEvent, Resource, ResourceType } from '../../types';
import { Context } from 'aws-lambda';

/**
 * Property-Based Tests for Resource Type Coverage
 * 
 * Feature: production-aws-saas-transformation
 * Task: 2.13 Write property test for resource type coverage
 * 
 * These tests validate Property 2: Resource Type Coverage
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */

// Mock all scanner modules
vi.mock('../../utils/region-discovery', () => ({
  discoverEnabledRegions: vi.fn(),
}));

vi.mock('../../utils/aws-clients', () => ({
  createAWSClients: vi.fn(),
  assumeRoleAndCreateClients: vi.fn(),
  createRegionalClients: vi.fn(),
}));

vi.mock('../../scanners/ec2-scanner', () => ({
  scanEC2Resources: vi.fn(),
}));

vi.mock('../../scanners/s3-scanner', () => ({
  scanS3Resources: vi.fn(),
}));

vi.mock('../../scanners/rds-scanner', () => ({
  scanRDSResources: vi.fn(),
}));

vi.mock('../../scanners/lambda-scanner', () => ({
  scanLambdaResources: vi.fn(),
}));

vi.mock('../../scanners/networking-scanner', () => ({
  scanNetworkingResources: vi.fn(),
}));

vi.mock('../../scanners/iam-scanner', () => ({
  scanIAMResources: vi.fn(),
}));

vi.mock('../../scanners/cloudwatch-scanner', () => ({
  scanCloudWatchResources: vi.fn(),
}));

vi.mock('../../scanners/cost-scanner', () => ({
  scanCostData: vi.fn(),
}));

vi.mock('../../utils/dynamodb', () => ({
  storeScanResult: vi.fn(),
}));

describe('Property 2: Resource Type Coverage', () => {
  /**
   * **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
   * 
   * For any AWS region containing resources, when the Scanner scans that region,
   * the scan results should include all supported resource types (EC2, S3, RDS,
   * Lambda, Networking, IAM, CloudWatch) that exist in that region.
   */
  it('should include all supported resource types when they exist in the region', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary regions
        fc.array(
          fc.constantFrom(
            'us-east-1',
            'us-west-2',
            'eu-west-1',
            'ap-southeast-1'
          ),
          { minLength: 1, maxLength: 3 }
        ),
        // Generate resource types that should be present
        fc.record({
          hasEC2: fc.boolean(),
          hasS3: fc.boolean(),
          hasRDS: fc.boolean(),
          hasLambda: fc.boolean(),
          hasNetworking: fc.boolean(),
          hasIAM: fc.boolean(),
          hasCloudWatch: fc.boolean(),
        }),
        async (regions, resourcePresence) => {
          // Import mocked modules
          const { discoverEnabledRegions } = await import('../../utils/region-discovery');
          const { createAWSClients, createRegionalClients } = await import('../../utils/aws-clients');
          const { scanEC2Resources } = await import('../../scanners/ec2-scanner');
          const { scanS3Resources } = await import('../../scanners/s3-scanner');
          const { scanRDSResources } = await import('../../scanners/rds-scanner');
          const { scanLambdaResources } = await import('../../scanners/lambda-scanner');
          const { scanNetworkingResources } = await import('../../scanners/networking-scanner');
          const { scanIAMResources } = await import('../../scanners/iam-scanner');
          const { scanCloudWatchResources } = await import('../../scanners/cloudwatch-scanner');
          const { scanCostData } = await import('../../scanners/cost-scanner');
          const { storeScanResult } = await import('../../utils/dynamodb');

          // Setup mocks
          vi.mocked(discoverEnabledRegions).mockResolvedValue(regions);
          vi.mocked(createAWSClients).mockReturnValue({} as any);
          vi.mocked(createRegionalClients).mockReturnValue({} as any);
          vi.mocked(storeScanResult).mockResolvedValue(undefined);

          // Mock EC2 scanner (Requirement 3.2)
          const ec2Resources: Resource[] = resourcePresence.hasEC2
            ? [
                createMockResource('EC2_Instance', regions[0]),
                createMockResource('EBS_Volume', regions[0]),
                createMockResource('Elastic_IP', regions[0]),
                createMockResource('Security_Group', regions[0]),
                createMockResource('VPC', regions[0]),
              ]
            : [];
          vi.mocked(scanEC2Resources).mockResolvedValue({
            resources: ec2Resources,
            errors: [],
          });

          // Mock S3 scanner (Requirement 3.3)
          const s3Resources: Resource[] = resourcePresence.hasS3
            ? [createMockResource('S3_Bucket', 'global')]
            : [];
          vi.mocked(scanS3Resources).mockResolvedValue({
            resources: s3Resources,
            errors: [],
          });

          // Mock RDS scanner (Requirement 3.4)
          const rdsResources: Resource[] = resourcePresence.hasRDS
            ? [createMockResource('RDS_Instance', regions[0])]
            : [];
          vi.mocked(scanRDSResources).mockResolvedValue({
            resources: rdsResources,
            errors: [],
          });

          // Mock Lambda scanner (Requirement 3.5)
          const lambdaResources: Resource[] = resourcePresence.hasLambda
            ? [
                createMockResource('Lambda_Function', regions[0]),
                createMockResource('ECS_Task', regions[0]),
                createMockResource('EKS_Cluster', regions[0]),
              ]
            : [];
          vi.mocked(scanLambdaResources).mockResolvedValue({
            resources: lambdaResources,
            errors: [],
          });

          // Mock Networking scanner (Requirement 3.6)
          const networkingResources: Resource[] = resourcePresence.hasNetworking
            ? [
                createMockResource('Load_Balancer', regions[0]),
                createMockResource('NAT_Gateway', regions[0]),
              ]
            : [];
          vi.mocked(scanNetworkingResources).mockResolvedValue({
            resources: networkingResources,
            errors: [],
          });

          // Mock IAM scanner (Requirement 3.7)
          const iamResources: Resource[] = resourcePresence.hasIAM
            ? [
                createMockResource('IAM_User', 'global'),
                createMockResource('IAM_Role', 'global'),
              ]
            : [];
          vi.mocked(scanIAMResources).mockResolvedValue({
            resources: iamResources,
            errors: [],
          });

          // Mock CloudWatch scanner (Requirement 3.8)
          const cloudwatchResources: Resource[] = resourcePresence.hasCloudWatch
            ? [
                createMockResource('CloudWatch_LogGroup', regions[0]),
                createMockResource('CloudWatch_Alarm', regions[0]),
              ]
            : [];
          vi.mocked(scanCloudWatchResources).mockResolvedValue({
            resources: cloudwatchResources,
            errors: [],
          });

          // Mock cost scanner
          vi.mocked(scanCostData).mockResolvedValue({
            costData: {
              estimatedMonthly: 1000,
              byService: {},
              byRegion: {},
            },
            errors: [],
          });

          // Arrange: Create scan event
          const scanEvent: ScanEvent = {
            userId: 'test-user',
            regions,
          };

          const mockContext = {
            awsRequestId: 'test-request-id',
          } as Context;

          // Act: Execute scan
          const response = await handler(scanEvent, mockContext);

          // Assert: Verify response is successful
          expect(response.statusCode).toBe(200);

          const result = JSON.parse(response.body);
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();

          const scanResult = result.data;
          const scannedResourceTypes = new Set(
            scanResult.resources.map((r: Resource) => r.resourceType)
          );

          // Property 2: Resource Type Coverage
          // Verify that all resource types that exist are included in the scan results

          // Requirement 3.2: EC2 resources
          if (resourcePresence.hasEC2) {
            expect(scannedResourceTypes.has('EC2_Instance')).toBe(true);
            expect(scannedResourceTypes.has('EBS_Volume')).toBe(true);
            expect(scannedResourceTypes.has('Elastic_IP')).toBe(true);
            expect(scannedResourceTypes.has('Security_Group')).toBe(true);
            expect(scannedResourceTypes.has('VPC')).toBe(true);
          }

          // Requirement 3.3: S3 resources
          if (resourcePresence.hasS3) {
            expect(scannedResourceTypes.has('S3_Bucket')).toBe(true);
          }

          // Requirement 3.4: RDS resources
          if (resourcePresence.hasRDS) {
            expect(scannedResourceTypes.has('RDS_Instance')).toBe(true);
          }

          // Requirement 3.5: Lambda and compute resources
          if (resourcePresence.hasLambda) {
            expect(scannedResourceTypes.has('Lambda_Function')).toBe(true);
            expect(scannedResourceTypes.has('ECS_Task')).toBe(true);
            expect(scannedResourceTypes.has('EKS_Cluster')).toBe(true);
          }

          // Requirement 3.6: Networking resources
          if (resourcePresence.hasNetworking) {
            expect(scannedResourceTypes.has('Load_Balancer')).toBe(true);
            expect(scannedResourceTypes.has('NAT_Gateway')).toBe(true);
          }

          // Requirement 3.7: IAM resources
          if (resourcePresence.hasIAM) {
            expect(scannedResourceTypes.has('IAM_User')).toBe(true);
            expect(scannedResourceTypes.has('IAM_Role')).toBe(true);
          }

          // Requirement 3.8: CloudWatch resources
          if (resourcePresence.hasCloudWatch) {
            expect(scannedResourceTypes.has('CloudWatch_LogGroup')).toBe(true);
            expect(scannedResourceTypes.has('CloudWatch_Alarm')).toBe(true);
          }

          // Verify summary includes all resource types
          const summary = scanResult.summary;
          expect(summary.totalResources).toBe(scanResult.resources.length);
          expect(summary.byType).toBeDefined();

          // Verify each resource type in summary matches actual resources
          for (const resourceType of scannedResourceTypes) {
            const expectedCount = scanResult.resources.filter(
              (r: Resource) => r.resourceType === resourceType
            ).length;
            expect(summary.byType[resourceType]).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scan all resource types across multiple regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple regions
        fc.array(
          fc.constantFrom(
            'us-east-1',
            'us-west-2',
            'eu-west-1',
            'ap-southeast-1',
            'ca-central-1'
          ),
          { minLength: 2, maxLength: 4 }
        ),
        async (regions) => {
          // Import mocked modules
          const { discoverEnabledRegions } = await import('../../utils/region-discovery');
          const { createAWSClients, createRegionalClients } = await import('../../utils/aws-clients');
          const { scanEC2Resources } = await import('../../scanners/ec2-scanner');
          const { scanS3Resources } = await import('../../scanners/s3-scanner');
          const { scanRDSResources } = await import('../../scanners/rds-scanner');
          const { scanLambdaResources } = await import('../../scanners/lambda-scanner');
          const { scanNetworkingResources } = await import('../../scanners/networking-scanner');
          const { scanIAMResources } = await import('../../scanners/iam-scanner');
          const { scanCloudWatchResources } = await import('../../scanners/cloudwatch-scanner');
          const { scanCostData } = await import('../../scanners/cost-scanner');
          const { storeScanResult } = await import('../../utils/dynamodb');

          // Setup mocks
          vi.mocked(discoverEnabledRegions).mockResolvedValue(regions);
          vi.mocked(createAWSClients).mockReturnValue({} as any);
          vi.mocked(createRegionalClients).mockReturnValue({} as any);
          vi.mocked(storeScanResult).mockResolvedValue(undefined);

          // Mock scanners to return resources for each region
          vi.mocked(scanEC2Resources).mockImplementation(async (client, region) => ({
            resources: [createMockResource('EC2_Instance', region)],
            errors: [],
          }));

          vi.mocked(scanS3Resources).mockResolvedValue({
            resources: [createMockResource('S3_Bucket', 'global')],
            errors: [],
          });

          vi.mocked(scanRDSResources).mockImplementation(async (rds, ddb, region) => ({
            resources: [createMockResource('RDS_Instance', region)],
            errors: [],
          }));

          vi.mocked(scanLambdaResources).mockImplementation(async (lambda, ecs, eks, region) => ({
            resources: [createMockResource('Lambda_Function', region)],
            errors: [],
          }));

          vi.mocked(scanNetworkingResources).mockImplementation(async (elb, ec2, region) => ({
            resources: [createMockResource('Load_Balancer', region)],
            errors: [],
          }));

          vi.mocked(scanIAMResources).mockResolvedValue({
            resources: [createMockResource('IAM_User', 'global')],
            errors: [],
          });

          vi.mocked(scanCloudWatchResources).mockImplementation(async (cw, cwl, region) => ({
            resources: [createMockResource('CloudWatch_LogGroup', region)],
            errors: [],
          }));

          vi.mocked(scanCostData).mockResolvedValue({
            costData: {
              estimatedMonthly: 1000,
              byService: {},
              byRegion: {},
            },
            errors: [],
          });

          // Arrange: Create scan event
          const scanEvent: ScanEvent = {
            userId: 'test-user',
            regions,
          };

          const mockContext = {
            awsRequestId: 'test-request-id',
          } as Context;

          // Act: Execute scan
          const response = await handler(scanEvent, mockContext);

          // Assert: Verify response is successful
          expect(response.statusCode).toBe(200);

          const result = JSON.parse(response.body);
          const scanResult = result.data;

          // Verify resources from all regions are included
          const scannedRegions = new Set(
            scanResult.resources.map((r: Resource) => r.region)
          );

          // All regions should be represented (plus 'global' for S3 and IAM)
          for (const region of regions) {
            expect(scannedRegions.has(region)).toBe(true);
          }
          expect(scannedRegions.has('global')).toBe(true);

          // Verify all resource types are present
          const scannedResourceTypes = new Set(
            scanResult.resources.map((r: Resource) => r.resourceType)
          );

          // Should have at least one resource of each type
          expect(scannedResourceTypes.has('EC2_Instance')).toBe(true);
          expect(scannedResourceTypes.has('S3_Bucket')).toBe(true);
          expect(scannedResourceTypes.has('RDS_Instance')).toBe(true);
          expect(scannedResourceTypes.has('Lambda_Function')).toBe(true);
          expect(scannedResourceTypes.has('Load_Balancer')).toBe(true);
          expect(scannedResourceTypes.has('IAM_User')).toBe(true);
          expect(scannedResourceTypes.has('CloudWatch_LogGroup')).toBe(true);

          // Verify summary by region
          expect(scanResult.summary.byRegion).toBeDefined();
          for (const region of regions) {
            expect(scanResult.summary.byRegion[region]).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty scan results gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('us-east-1', 'us-west-2'),
          { minLength: 1, maxLength: 2 }
        ),
        async (regions) => {
          // Import mocked modules
          const { discoverEnabledRegions } = await import('../../utils/region-discovery');
          const { createAWSClients, createRegionalClients } = await import('../../utils/aws-clients');
          const { scanEC2Resources } = await import('../../scanners/ec2-scanner');
          const { scanS3Resources } = await import('../../scanners/s3-scanner');
          const { scanRDSResources } = await import('../../scanners/rds-scanner');
          const { scanLambdaResources } = await import('../../scanners/lambda-scanner');
          const { scanNetworkingResources } = await import('../../scanners/networking-scanner');
          const { scanIAMResources } = await import('../../scanners/iam-scanner');
          const { scanCloudWatchResources } = await import('../../scanners/cloudwatch-scanner');
          const { scanCostData } = await import('../../scanners/cost-scanner');
          const { storeScanResult } = await import('../../utils/dynamodb');

          // Setup mocks - all scanners return empty results
          vi.mocked(discoverEnabledRegions).mockResolvedValue(regions);
          vi.mocked(createAWSClients).mockReturnValue({} as any);
          vi.mocked(createRegionalClients).mockReturnValue({} as any);
          vi.mocked(storeScanResult).mockResolvedValue(undefined);

          vi.mocked(scanEC2Resources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanS3Resources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanRDSResources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanLambdaResources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanNetworkingResources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanIAMResources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanCloudWatchResources).mockResolvedValue({ resources: [], errors: [] });
          vi.mocked(scanCostData).mockResolvedValue({
            costData: { estimatedMonthly: 0, byService: {}, byRegion: {} },
            errors: [],
          });

          // Arrange: Create scan event
          const scanEvent: ScanEvent = {
            userId: 'test-user',
            regions,
          };

          const mockContext = {
            awsRequestId: 'test-request-id',
          } as Context;

          // Act: Execute scan
          const response = await handler(scanEvent, mockContext);

          // Assert: Should still return successful response
          expect(response.statusCode).toBe(200);

          const result = JSON.parse(response.body);
          expect(result.success).toBe(true);

          const scanResult = result.data;
          expect(scanResult.resources).toEqual([]);
          expect(scanResult.summary.totalResources).toBe(0);
          expect(scanResult.summary.byType).toEqual({});
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to create mock resources
 */
function createMockResource(resourceType: ResourceType, region: string): Resource {
  return {
    resourceId: `${resourceType}-${Math.random().toString(36).substring(7)}`,
    resourceName: `mock-${resourceType}`,
    resourceType,
    region,
    state: 'active',
    creationDate: new Date().toISOString(),
    tags: {},
    metadata: {},
  };
}

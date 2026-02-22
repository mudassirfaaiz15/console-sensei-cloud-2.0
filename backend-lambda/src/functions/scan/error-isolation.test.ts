import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { handler } from './index';
import { ScanEvent, Resource } from '../../types';
import { Context } from 'aws-lambda';

/**
 * Property-Based Tests for Error Isolation in Multi-Region Scanning
 * 
 * Feature: production-aws-saas-transformation
 * Task: 2.15 Write property test for error isolation
 * 
 * These tests validate Property 4: Error Isolation in Multi-Region Scanning
 * **Validates: Requirements 3.10**
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

describe('Property 4: Error Isolation in Multi-Region Scanning', () => {
  /**
   * **Validates: Requirements 3.10**
   * 
   * For any multi-region scan where one region fails, the Scanner should still
   * successfully scan and return results from all other accessible regions.
   */
  it('should return results from successful regions when one region fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate at least 2 regions
        fc.array(
          fc.constantFrom(
            'us-east-1',
            'us-west-2',
            'eu-west-1',
            'ap-southeast-1',
            'ca-central-1'
          ),
          { minLength: 2, maxLength: 5 }
        ),
        // Pick which region should fail
        fc.nat(),
        async (regions, failureIndexSeed) => {
          // Ensure unique regions
          const uniqueRegions = Array.from(new Set(regions));
          if (uniqueRegions.length < 2) {
            // Skip if we don't have at least 2 unique regions
            return;
          }

          // Determine which region will fail
          const failureIndex = failureIndexSeed % uniqueRegions.length;
          const failingRegion = uniqueRegions[failureIndex];

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
          vi.mocked(discoverEnabledRegions).mockResolvedValue(uniqueRegions);
          vi.mocked(createAWSClients).mockReturnValue({} as any);
          vi.mocked(createRegionalClients).mockReturnValue({} as any);
          vi.mocked(storeScanResult).mockResolvedValue(undefined);

          // Mock scanners to succeed for all regions except the failing one
          vi.mocked(scanEC2Resources).mockImplementation(async (client, region) => {
            if (region === failingRegion) {
              throw new Error(`EC2 scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('EC2_Instance', region)],
              errors: [],
            };
          });

          vi.mocked(scanRDSResources).mockImplementation(async (rds, ddb, region) => {
            if (region === failingRegion) {
              throw new Error(`RDS scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('RDS_Instance', region)],
              errors: [],
            };
          });

          vi.mocked(scanLambdaResources).mockImplementation(async (lambda, ecs, eks, region) => {
            if (region === failingRegion) {
              throw new Error(`Lambda scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('Lambda_Function', region)],
              errors: [],
            };
          });

          vi.mocked(scanNetworkingResources).mockImplementation(async (elb, ec2, region) => {
            if (region === failingRegion) {
              throw new Error(`Networking scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('Load_Balancer', region)],
              errors: [],
            };
          });

          vi.mocked(scanCloudWatchResources).mockImplementation(async (cw, cwl, region) => {
            if (region === failingRegion) {
              throw new Error(`CloudWatch scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('CloudWatch_LogGroup', region)],
              errors: [],
            };
          });

          // Mock global services (S3, IAM, Cost) to succeed
          vi.mocked(scanS3Resources).mockResolvedValue({
            resources: [createMockResource('S3_Bucket', 'global')],
            errors: [],
          });

          vi.mocked(scanIAMResources).mockResolvedValue({
            resources: [createMockResource('IAM_User', 'global')],
            errors: [],
          });

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
            regions: uniqueRegions,
          };

          const mockContext = {
            awsRequestId: 'test-request-id',
          } as Context;

          // Act: Execute scan
          const response = await handler(scanEvent, mockContext);

          // Assert: Property 4 - Error Isolation in Multi-Region Scanning
          expect(response.statusCode).toBe(200);

          const result = JSON.parse(response.body);
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();

          const scanResult = result.data;

          // 1. The scan should complete successfully despite the region failure
          expect(scanResult.scanId).toBeDefined();
          expect(scanResult.userId).toBe('test-user');
          expect(scanResult.timestamp).toBeDefined();

          // 2. Resources from successful regions should be present
          const successfulRegions = uniqueRegions.filter(r => r !== failingRegion);
          const scannedRegions = new Set(
            scanResult.resources
              .filter((r: Resource) => r.region !== 'global')
              .map((r: Resource) => r.region)
          );

          // All successful regions should have resources
          for (const region of successfulRegions) {
            expect(scannedRegions.has(region)).toBe(true);
          }

          // 3. Resources from the failing region should not be present
          // (or if present, should be minimal due to partial failure)
          const failingRegionResources = scanResult.resources.filter(
            (r: Resource) => r.region === failingRegion
          );
          
          // The failing region should have no resources or very few
          // (depending on which scanner failed first)
          expect(failingRegionResources.length).toBeLessThanOrEqual(0);

          // 4. Global services (S3, IAM) should still be scanned
          const globalResources = scanResult.resources.filter(
            (r: Resource) => r.region === 'global'
          );
          expect(globalResources.length).toBeGreaterThan(0);

          // 5. Errors should be recorded for the failing region
          expect(scanResult.errors.length).toBeGreaterThan(0);
          
          const failingRegionErrors = scanResult.errors.filter(
            (e: any) => e.region === failingRegion
          );
          expect(failingRegionErrors.length).toBeGreaterThan(0);

          // 6. The total number of resources should be greater than 0
          // (from successful regions and global services)
          expect(scanResult.resources.length).toBeGreaterThan(0);

          // 7. Summary should reflect resources from successful regions
          expect(scanResult.summary.totalResources).toBe(scanResult.resources.length);
          expect(scanResult.summary.byRegion).toBeDefined();

          // Successful regions should be in the summary
          for (const region of successfulRegions) {
            expect(scanResult.summary.byRegion[region]).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple region failures and still return results from successful regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate at least 3 regions
        fc.array(
          fc.constantFrom(
            'us-east-1',
            'us-west-2',
            'eu-west-1',
            'ap-southeast-1',
            'ca-central-1',
            'sa-east-1'
          ),
          { minLength: 3, maxLength: 6 }
        ),
        // Number of regions that should fail (at least 1, at most n-1)
        fc.nat(),
        async (regions, failureCountSeed) => {
          // Ensure unique regions
          const uniqueRegions = Array.from(new Set(regions));
          if (uniqueRegions.length < 3) {
            return;
          }

          // Determine how many regions will fail (at least 1, at most n-1)
          const maxFailures = uniqueRegions.length - 1;
          const failureCount = (failureCountSeed % maxFailures) + 1;
          
          // Pick which regions will fail
          const failingRegions = new Set(
            uniqueRegions.slice(0, failureCount)
          );

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
          vi.mocked(discoverEnabledRegions).mockResolvedValue(uniqueRegions);
          vi.mocked(createAWSClients).mockReturnValue({} as any);
          vi.mocked(createRegionalClients).mockReturnValue({} as any);
          vi.mocked(storeScanResult).mockResolvedValue(undefined);

          // Mock scanners to fail for failing regions
          vi.mocked(scanEC2Resources).mockImplementation(async (client, region) => {
            if (failingRegions.has(region)) {
              throw new Error(`EC2 scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('EC2_Instance', region)],
              errors: [],
            };
          });

          vi.mocked(scanRDSResources).mockImplementation(async (rds, ddb, region) => {
            if (failingRegions.has(region)) {
              throw new Error(`RDS scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('RDS_Instance', region)],
              errors: [],
            };
          });

          vi.mocked(scanLambdaResources).mockImplementation(async (lambda, ecs, eks, region) => {
            if (failingRegions.has(region)) {
              throw new Error(`Lambda scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('Lambda_Function', region)],
              errors: [],
            };
          });

          vi.mocked(scanNetworkingResources).mockImplementation(async (elb, ec2, region) => {
            if (failingRegions.has(region)) {
              throw new Error(`Networking scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('Load_Balancer', region)],
              errors: [],
            };
          });

          vi.mocked(scanCloudWatchResources).mockImplementation(async (cw, cwl, region) => {
            if (failingRegions.has(region)) {
              throw new Error(`CloudWatch scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('CloudWatch_LogGroup', region)],
              errors: [],
            };
          });

          // Mock global services to succeed
          vi.mocked(scanS3Resources).mockResolvedValue({
            resources: [createMockResource('S3_Bucket', 'global')],
            errors: [],
          });

          vi.mocked(scanIAMResources).mockResolvedValue({
            resources: [createMockResource('IAM_User', 'global')],
            errors: [],
          });

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
            regions: uniqueRegions,
          };

          const mockContext = {
            awsRequestId: 'test-request-id',
          } as Context;

          // Act: Execute scan
          const response = await handler(scanEvent, mockContext);

          // Assert: Property 4 - Error Isolation with Multiple Failures
          expect(response.statusCode).toBe(200);

          const result = JSON.parse(response.body);
          const scanResult = result.data;

          // 1. Scan should complete successfully
          expect(scanResult.scanId).toBeDefined();

          // 2. Resources from successful regions should be present
          const successfulRegions = uniqueRegions.filter(r => !failingRegions.has(r));
          const scannedRegions = new Set(
            scanResult.resources
              .filter((r: Resource) => r.region !== 'global')
              .map((r: Resource) => r.region)
          );

          for (const region of successfulRegions) {
            expect(scannedRegions.has(region)).toBe(true);
          }

          // 3. At least one successful region should have resources
          expect(successfulRegions.length).toBeGreaterThan(0);
          
          const successfulRegionResources = scanResult.resources.filter(
            (r: Resource) => successfulRegions.includes(r.region)
          );
          expect(successfulRegionResources.length).toBeGreaterThan(0);

          // 4. Errors should be recorded for all failing regions
          const errorRegions = new Set(
            scanResult.errors.map((e: any) => e.region)
          );
          
          for (const failingRegion of failingRegions) {
            expect(errorRegions.has(failingRegion)).toBe(true);
          }

          // 5. Global services should still be scanned
          const globalResources = scanResult.resources.filter(
            (r: Resource) => r.region === 'global'
          );
          expect(globalResources.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle partial service failures within a region', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1'),
          { minLength: 2, maxLength: 3 }
        ),
        async (regions) => {
          const uniqueRegions = Array.from(new Set(regions));
          if (uniqueRegions.length < 2) {
            return;
          }

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
          vi.mocked(discoverEnabledRegions).mockResolvedValue(uniqueRegions);
          vi.mocked(createAWSClients).mockReturnValue({} as any);
          vi.mocked(createRegionalClients).mockReturnValue({} as any);
          vi.mocked(storeScanResult).mockResolvedValue(undefined);

          // Mock EC2 to fail in first region, but other services succeed
          vi.mocked(scanEC2Resources).mockImplementation(async (client, region) => {
            if (region === uniqueRegions[0]) {
              throw new Error(`EC2 scan failed in ${region}`);
            }
            return {
              resources: [createMockResource('EC2_Instance', region)],
              errors: [],
            };
          });

          // Other services succeed in all regions
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

          vi.mocked(scanCloudWatchResources).mockImplementation(async (cw, cwl, region) => ({
            resources: [createMockResource('CloudWatch_LogGroup', region)],
            errors: [],
          }));

          vi.mocked(scanS3Resources).mockResolvedValue({
            resources: [createMockResource('S3_Bucket', 'global')],
            errors: [],
          });

          vi.mocked(scanIAMResources).mockResolvedValue({
            resources: [createMockResource('IAM_User', 'global')],
            errors: [],
          });

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
            regions: uniqueRegions,
          };

          const mockContext = {
            awsRequestId: 'test-request-id',
          } as Context;

          // Act: Execute scan
          const response = await handler(scanEvent, mockContext);

          // Assert: Partial service failure should not prevent other services
          expect(response.statusCode).toBe(200);

          const result = JSON.parse(response.body);
          const scanResult = result.data;

          // 1. Should have resources from other services in the failing region
          const firstRegionResources = scanResult.resources.filter(
            (r: Resource) => r.region === uniqueRegions[0]
          );
          
          // Should have RDS, Lambda, Networking, CloudWatch but not EC2
          expect(firstRegionResources.length).toBeGreaterThan(0);
          
          const firstRegionResourceTypes = new Set(
            firstRegionResources.map((r: Resource) => r.resourceType)
          );
          
          expect(firstRegionResourceTypes.has('EC2_Instance')).toBe(false);
          expect(firstRegionResourceTypes.has('RDS_Instance')).toBe(true);

          // 2. Should have error for EC2 in first region
          const ec2Errors = scanResult.errors.filter(
            (e: any) => e.service === 'EC2' && e.region === uniqueRegions[0]
          );
          expect(ec2Errors.length).toBeGreaterThan(0);

          // 3. Other regions should have all resources including EC2
          for (let i = 1; i < uniqueRegions.length; i++) {
            const regionResources = scanResult.resources.filter(
              (r: Resource) => r.region === uniqueRegions[i]
            );
            
            const resourceTypes = new Set(
              regionResources.map((r: Resource) => r.resourceType)
            );
            
            expect(resourceTypes.has('EC2_Instance')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to create mock resources
 */
function createMockResource(resourceType: string, region: string): Resource {
  return {
    resourceId: `${resourceType}-${Math.random().toString(36).substring(7)}`,
    resourceName: `mock-${resourceType}`,
    resourceType: resourceType as any,
    region,
    state: 'active',
    creationDate: new Date().toISOString(),
    tags: {},
    metadata: {},
  };
}

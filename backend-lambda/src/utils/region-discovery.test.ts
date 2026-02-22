import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { discoverEnabledRegions, isValidRegion, filterValidRegions } from './region-discovery';
import { AWSClients } from './aws-clients';
import { DescribeRegionsCommandOutput } from '@aws-sdk/client-ec2';

/**
 * Property-Based Tests for Region Discovery
 * 
 * Feature: production-aws-saas-transformation
 * Task: 2.12 Write property test for region discovery
 * 
 * These tests validate Property 1: Region Discovery Completeness
 * Validates: Requirements 3.1
 */

describe('Property 1: Region Discovery Completeness', () => {
  /**
   * **Validates: Requirements 3.1**
   * 
   * For any AWS account with enabled regions, when the Scanner discovers regions,
   * the returned list should be non-empty and contain only valid AWS region identifiers.
   */
  it('should return non-empty list with valid AWS region identifiers for any enabled regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary list of valid AWS regions
        fc.array(
          fc.record({
            RegionName: fc.constantFrom(
              'us-east-1',
              'us-east-2',
              'us-west-1',
              'us-west-2',
              'eu-west-1',
              'eu-west-2',
              'eu-west-3',
              'eu-central-1',
              'eu-north-1',
              'ap-south-1',
              'ap-northeast-1',
              'ap-northeast-2',
              'ap-northeast-3',
              'ap-southeast-1',
              'ap-southeast-2',
              'ca-central-1',
              'sa-east-1',
              'af-south-1',
              'me-south-1'
            ),
            OptInStatus: fc.constantFrom('opt-in-not-required', 'opted-in'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (regions) => {
          // Arrange: Mock AWS clients with the generated regions
          const mockEC2Client = {
            send: vi.fn().mockResolvedValue({
              Regions: regions,
            } as DescribeRegionsCommandOutput),
          };

          const mockClients = {
            ec2: mockEC2Client,
          } as unknown as AWSClients;

          // Act: Discover regions
          const discoveredRegions = await discoverEnabledRegions(mockClients);

          // Assert: Property 1 - Region Discovery Completeness
          // 1. The returned list should be non-empty
          expect(discoveredRegions.length).toBeGreaterThan(0);

          // 2. All returned regions should be valid AWS region identifiers
          for (const region of discoveredRegions) {
            expect(isValidRegion(region)).toBe(true);
          }

          // 3. All returned regions should match the AWS region format
          const regionPattern = /^[a-z]{2,3}-[a-z]+-\d+$/;
          for (const region of discoveredRegions) {
            expect(region).toMatch(regionPattern);
          }

          // 4. The list should contain all the regions from the API response
          expect(discoveredRegions.length).toBe(regions.length);

          // 5. Each region from the API should be in the discovered list
          for (const region of regions) {
            if (region.RegionName) {
              expect(discoveredRegions).toContain(region.RegionName);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid regions even when API returns empty list (fallback behavior)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Test with empty regions array
        fc.constant([]),
        async (regions) => {
          // Arrange: Mock AWS clients with empty regions
          const mockEC2Client = {
            send: vi.fn().mockResolvedValue({
              Regions: regions,
            } as DescribeRegionsCommandOutput),
          };

          const mockClients = {
            ec2: mockEC2Client,
          } as unknown as AWSClients;

          // Act: Discover regions
          const discoveredRegions = await discoverEnabledRegions(mockClients);

          // Assert: Should fall back to default regions
          // 1. The returned list should be non-empty (fallback to defaults)
          expect(discoveredRegions.length).toBeGreaterThan(0);

          // 2. All returned regions should be valid AWS region identifiers
          for (const region of discoveredRegions) {
            expect(isValidRegion(region)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid regions even when API throws error (fallback behavior)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary error messages
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          // Arrange: Mock AWS clients that throw errors
          const mockEC2Client = {
            send: vi.fn().mockRejectedValue(new Error(errorMessage)),
          };

          const mockClients = {
            ec2: mockEC2Client,
          } as unknown as AWSClients;

          // Act: Discover regions
          const discoveredRegions = await discoverEnabledRegions(mockClients);

          // Assert: Should fall back to default regions
          // 1. The returned list should be non-empty (fallback to defaults)
          expect(discoveredRegions.length).toBeGreaterThan(0);

          // 2. All returned regions should be valid AWS region identifiers
          for (const region of discoveredRegions) {
            expect(isValidRegion(region)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter out undefined region names from API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate regions with some undefined RegionName values
        fc.array(
          fc.record({
            RegionName: fc.option(
              fc.constantFrom(
                'us-east-1',
                'us-west-2',
                'eu-west-1',
                'ap-southeast-1'
              ),
              { nil: undefined }
            ),
            OptInStatus: fc.constantFrom('opt-in-not-required', 'opted-in'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (regions) => {
          // Arrange: Mock AWS clients with regions that may have undefined names
          const mockEC2Client = {
            send: vi.fn().mockResolvedValue({
              Regions: regions,
            } as DescribeRegionsCommandOutput),
          };

          const mockClients = {
            ec2: mockEC2Client,
          } as unknown as AWSClients;

          // Act: Discover regions
          const discoveredRegions = await discoverEnabledRegions(mockClients);

          // Assert: Should filter out undefined values
          // 1. No undefined values in the result
          for (const region of discoveredRegions) {
            expect(region).toBeDefined();
            expect(typeof region).toBe('string');
          }

          // 2. All returned regions should be valid
          for (const region of discoveredRegions) {
            expect(isValidRegion(region)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return sorted list of regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary list of valid AWS regions
        fc.array(
          fc.record({
            RegionName: fc.constantFrom(
              'us-east-1',
              'us-west-2',
              'eu-west-1',
              'ap-southeast-1',
              'ca-central-1'
            ),
            OptInStatus: fc.constantFrom('opt-in-not-required', 'opted-in'),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (regions) => {
          // Arrange: Mock AWS clients
          const mockEC2Client = {
            send: vi.fn().mockResolvedValue({
              Regions: regions,
            } as DescribeRegionsCommandOutput),
          };

          const mockClients = {
            ec2: mockEC2Client,
          } as unknown as AWSClients;

          // Act: Discover regions
          const discoveredRegions = await discoverEnabledRegions(mockClients);

          // Assert: Should be sorted alphabetically
          const sortedRegions = [...discoveredRegions].sort();
          expect(discoveredRegions).toEqual(sortedRegions);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Region Validation Utilities', () => {
  it('should correctly identify valid AWS region formats', () => {
    fc.assert(
      fc.property(
        // Generate valid AWS region patterns
        fc.record({
          prefix: fc.constantFrom('us', 'eu', 'ap', 'ca', 'sa', 'af', 'me'),
          direction: fc.constantFrom('east', 'west', 'north', 'south', 'central', 'northeast', 'southeast', 'northwest', 'southwest'),
          number: fc.integer({ min: 1, max: 9 }),
        }),
        ({ prefix, direction, number }) => {
          const region = `${prefix}-${direction}-${number}`;
          expect(isValidRegion(region)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid region formats', () => {
    fc.assert(
      fc.property(
        // Generate invalid region strings
        fc.oneof(
          fc.string().filter(s => !/^[a-z]{2,3}-[a-z]+-\d+$/.test(s)),
          fc.constant(''),
          fc.constant('invalid'),
          fc.constant('us-east'),
          fc.constant('us-east-'),
          fc.constant('-east-1'),
          fc.constant('us--1'),
        ),
        (invalidRegion) => {
          expect(isValidRegion(invalidRegion)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter out invalid regions from a list', () => {
    fc.assert(
      fc.property(
        // Generate mixed list of valid and invalid regions
        fc.array(
          fc.oneof(
            fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
            fc.string().filter(s => !/^[a-z]{2,3}-[a-z]+-\d+$/.test(s))
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (regions) => {
          const filtered = filterValidRegions(regions);

          // All filtered regions should be valid
          for (const region of filtered) {
            expect(isValidRegion(region)).toBe(true);
          }

          // Filtered list should not contain invalid regions
          for (const region of filtered) {
            expect(region).toMatch(/^[a-z]{2,3}-[a-z]+-\d+$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

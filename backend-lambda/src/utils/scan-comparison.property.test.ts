import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { compareScan } from './scan-comparison';
import { ScanResult, ScoreResult, Resource, Issue } from '../types';

/**
 * Property-Based Tests for Scan Comparison
 * 
 * Feature: production-aws-saas-transformation
 * Property 17: Scan Comparison Identifies Differences
 * 
 * For any two different scan results, the comparison function should identify 
 * and return all differences in resource counts, hygiene scores, and detected issues.
 * 
 * Validates: Requirements 10.3
 */

// Arbitraries for generating test data
const resourceArbitrary = fc.record({
  resourceId: fc.string({ minLength: 1 }),
  resourceName: fc.string(),
  resourceType: fc.constantFrom(
    'EC2_Instance',
    'S3_Bucket',
    'RDS_Instance',
    'Lambda_Function',
    'Load_Balancer'
  ),
  region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1'),
  state: fc.constantFrom('running', 'stopped', 'terminated'),
  creationDate: fc.string(),
  tags: fc.dictionary(fc.string(), fc.string()),
  metadata: fc.dictionary(fc.string(), fc.string()),
  estimatedCostMonthly: fc.option(fc.float({ min: 0, max: 10000 })),
});

const issueArbitrary = fc.record({
  type: fc.constantFrom('public_s3_bucket', 'open_security_group', 'unencrypted_volume'),
  severity: fc.constantFrom('critical', 'high', 'medium', 'low') as any,
  resourceId: fc.string({ minLength: 1 }),
  resourceName: fc.option(fc.string()),
  description: fc.string(),
  deduction: fc.float({ min: 0, max: 10 }),
});

const scanResultArbitrary = fc.record({
  scanId: fc.string({ minLength: 1 }),
  userId: fc.string({ minLength: 1 }),
  timestamp: fc.string(),
  resources: fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
  summary: fc.record({
    totalResources: fc.integer({ min: 0 }),
    byType: fc.dictionary(fc.string(), fc.integer({ min: 0 })),
    byRegion: fc.dictionary(fc.string(), fc.integer({ min: 0 })),
  }),
  costData: fc.option(
    fc.record({
      estimatedMonthly: fc.float({ min: 0, max: 100000 }),
      byService: fc.dictionary(fc.string(), fc.float({ min: 0 })),
      byRegion: fc.dictionary(fc.string(), fc.float({ min: 0 })),
    })
  ),
  errors: fc.array(
    fc.record({
      type: fc.string(),
      service: fc.string(),
      region: fc.option(fc.string()),
      message: fc.string(),
      timestamp: fc.string(),
    }),
    { maxLength: 10 }
  ),
});

const scoreResultArbitrary = fc.record({
  scanId: fc.string({ minLength: 1 }),
  userId: fc.string({ minLength: 1 }),
  timestamp: fc.string(),
  overallScore: fc.float({ min: 0, max: 100 }),
  breakdown: fc.record({
    security: fc.record({
      score: fc.float({ min: 0, max: 40 }),
      maxScore: fc.constant(40),
      issues: fc.array(issueArbitrary, { maxLength: 10 }),
    }),
    costEfficiency: fc.record({
      score: fc.float({ min: 0, max: 30 }),
      maxScore: fc.constant(30),
      issues: fc.array(issueArbitrary, { maxLength: 10 }),
    }),
    bestPractices: fc.record({
      score: fc.float({ min: 0, max: 30 }),
      maxScore: fc.constant(30),
      issues: fc.array(issueArbitrary, { maxLength: 10 }),
    }),
  }),
});

describe('Property 17: Scan Comparison Identifies Differences', () => {
  it('should identify new resources when current scan has more resources than previous', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 17: Scan Comparison Identifies Differences
     * 
     * For any two different scan results, the comparison function should identify 
     * and return all differences in resource counts, hygiene scores, and detected issues.
     */
    fc.assert(
      fc.property(
        scanResultArbitrary,
        resourceArbitrary,
        (previousScan, newResource) => {
          const currentScan = {
            ...previousScan,
            resources: [...previousScan.resources, newResource],
          };

          const previousScore = {
            ...fc.sample(scoreResultArbitrary, 1)[0],
            scanId: previousScan.scanId,
            userId: previousScan.userId,
          };

          const currentScore = {
            ...previousScore,
            scanId: currentScan.scanId,
          };

          const comparison = compareScan(currentScan, previousScan, currentScore, previousScore);

          // Should identify the new resource
          expect(comparison.newResources).toContain(newResource.resourceId);
          expect(comparison.resourceCountChange).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should identify deleted resources when current scan has fewer resources than previous', () => {
    fc.assert(
      fc.property(
        scanResultArbitrary.filter(s => s.resources.length > 0),
        (previousScan) => {
          const deletedResourceId = previousScan.resources[0].resourceId;
          const currentScan = {
            ...previousScan,
            resources: previousScan.resources.slice(1),
          };

          const previousScore = {
            ...fc.sample(scoreResultArbitrary, 1)[0],
            scanId: previousScan.scanId,
            userId: previousScan.userId,
          };

          const currentScore = {
            ...previousScore,
            scanId: currentScan.scanId,
          };

          const comparison = compareScan(currentScan, previousScan, currentScore, previousScore);

          // Should identify the deleted resource
          expect(comparison.deletedResources).toContain(deletedResourceId);
          expect(comparison.resourceCountChange).toBe(-1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should identify changed resources when resource state changes', () => {
    fc.assert(
      fc.property(
        scanResultArbitrary.filter(s => s.resources.length > 0),
        fc.constantFrom('running', 'stopped', 'terminated'),
        (previousScan, newState) => {
          const changedResource = previousScan.resources[0];
          if (changedResource.state === newState) {
            return; // Skip if state didn't actually change
          }

          const currentScan = {
            ...previousScan,
            resources: [
              { ...changedResource, state: newState },
              ...previousScan.resources.slice(1),
            ],
          };

          const previousScore = {
            ...fc.sample(scoreResultArbitrary, 1)[0],
            scanId: previousScan.scanId,
            userId: previousScan.userId,
          };

          const currentScore = {
            ...previousScore,
            scanId: currentScan.scanId,
          };

          const comparison = compareScan(currentScan, previousScan, currentScore, previousScore);

          // Should identify the changed resource
          expect(comparison.changedResources).toContain(changedResource.resourceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should identify new security issues', () => {
    fc.assert(
      fc.property(
        scoreResultArbitrary,
        issueArbitrary,
        (previousScore, newIssue) => {
          const currentScore = {
            ...previousScore,
            breakdown: {
              ...previousScore.breakdown,
              security: {
                ...previousScore.breakdown.security,
                issues: [...previousScore.breakdown.security.issues, newIssue],
              },
            },
          };

          const previousScan = {
            ...fc.sample(scanResultArbitrary, 1)[0],
            scanId: previousScore.scanId,
            userId: previousScore.userId,
          };

          const currentScan = {
            ...previousScan,
            scanId: currentScore.scanId,
          };

          const comparison = compareScan(currentScan, previousScan, currentScore, previousScore);

          // Should identify the new security issue
          expect(comparison.newSecurityIssues.length).toBeGreaterThan(0);
          expect(comparison.newSecurityIssues).toContainEqual(
            expect.objectContaining({
              type: newIssue.type,
              resourceId: newIssue.resourceId,
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate cost change correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.float({ min: 100, max: 10000, noNaN: true }),
        (previousCost, currentCost) => {
          const previousScan = {
            ...fc.sample(scanResultArbitrary, 1)[0],
            costData: {
              estimatedMonthly: previousCost,
              byService: {},
              byRegion: {},
            },
          };

          const currentScan = {
            ...previousScan,
            costData: {
              estimatedMonthly: currentCost,
              byService: {},
              byRegion: {},
            },
          };

          const previousScore = fc.sample(scoreResultArbitrary, 1)[0];
          const currentScore = { ...previousScore };

          const comparison = compareScan(currentScan, previousScan, currentScore, previousScore);

          // Verify cost change calculation
          const expectedCostChange = ((currentCost - previousCost) / previousCost) * 100;
          expect(comparison.costChange).toBeCloseTo(expectedCostChange, 1);
          expect(comparison.costDifference).toBeCloseTo(currentCost - previousCost, 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return first scan data when previous scan is null', () => {
    fc.assert(
      fc.property(scanResultArbitrary, scoreResultArbitrary, (currentScan, currentScore) => {
        const comparison = compareScan(currentScan, null, currentScore, null);

        // All current resources should be marked as new
        expect(comparison.newResources.length).toBe(currentScan.resources.length);
        expect(comparison.deletedResources.length).toBe(0);
        expect(comparison.changedResources.length).toBe(0);

        // All current security issues should be marked as new
        expect(comparison.newSecurityIssues.length).toBe(
          currentScore.breakdown.security.issues.length
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should generate a summary string', () => {
    fc.assert(
      fc.property(scanResultArbitrary, scoreResultArbitrary, (currentScan, currentScore) => {
        const comparison = compareScan(currentScan, null, currentScore, null);

        // Summary should be a non-empty string
        expect(comparison.summary).toBeTruthy();
        expect(typeof comparison.summary).toBe('string');
        expect(comparison.summary.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

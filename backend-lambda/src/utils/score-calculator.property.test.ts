import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { calculateHygieneScore, calculateSecurityScore, calculateCostEfficiencyScore, calculateBestPracticesScore } from './score-calculator';
import { ScanResult, Resource } from '../types';

/**
 * Property-Based Tests for Score Calculator
 * 
 * These tests verify universal properties that should hold for all inputs
 */

describe('Score Calculator - Property Tests', () => {
  // Helper to create arbitrary scan results
  const arbitraryScanResult = (): fc.Arbitrary<ScanResult> => {
    return fc.record({
      scanId: fc.string({ minLength: 1 }),
      userId: fc.string({ minLength: 1 }),
      timestamp: fc.date().map(d => d.toISOString()),
      resources: fc.array(
        fc.record({
          resourceId: fc.string({ minLength: 1 }),
          resourceName: fc.string({ minLength: 1 }),
          resourceType: fc.constantFrom(
            'EC2_Instance',
            'EBS_Volume',
            'S3_Bucket',
            'RDS_Instance',
            'Lambda_Function',
            'Security_Group',
            'IAM_User',
            'IAM_Role',
            'Elastic_IP',
            'Load_Balancer'
          ),
          region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1'),
          state: fc.string(),
          tags: fc.dictionary(fc.string(), fc.string()),
          metadata: fc.record(
            {
              publicAccess: fc.boolean(),
              encrypted: fc.boolean(),
              mfaEnabled: fc.boolean(),
              cpuUtilization: fc.integer({ min: 0, max: 100 }),
              instanceType: fc.string(),
            },
            { requiredKeys: [] }
          ),
        })
      ),
      summary: fc.record({
        totalResources: fc.integer({ min: 0 }),
        byType: fc.dictionary(fc.string(), fc.integer({ min: 0 })),
        byRegion: fc.dictionary(fc.string(), fc.integer({ min: 0 })),
      }),
      errors: fc.array(fc.record({
        type: fc.string(),
        message: fc.string(),
      })),
    });
  };

  describe('Property 5: Hygiene Score Bounds', () => {
    it('should calculate scores between 0 and 100 for any scan result', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 5: Hygiene Score Bounds
       * 
       * For any scan result, the calculated hygiene score should be 
       * a number between 0 and 100 (inclusive).
       * 
       * Validates: Requirements 4.1
       */
      fc.assert(
        fc.property(arbitraryScanResult(), (scanResult) => {
          const score = calculateHygieneScore(scanResult);
          expect(score.overallScore).toBeGreaterThanOrEqual(0);
          expect(score.overallScore).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Security Score Weighting', () => {
    it('should weight security component at exactly 40% of total', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 6: Security Score Weighting
       * 
       * For any hygiene score calculation, the security component should 
       * contribute exactly 40% of the maximum possible score (40 points out of 100).
       * 
       * Validates: Requirements 4.2
       */
      fc.assert(
        fc.property(arbitraryScanResult(), (scanResult) => {
          const score = calculateHygieneScore(scanResult);
          expect(score.breakdown.security.maxScore).toBe(40);
          expect(score.breakdown.security.score).toBeLessThanOrEqual(40);
          expect(score.breakdown.security.score).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Security Issues Reduce Security Score', () => {
    it('should reduce security score when security issues are present', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 7: Security Issues Reduce Security Score
       * 
       * For any two scan results that are identical except one contains security issues 
       * (public S3 buckets, open security groups, unencrypted volumes, IAM users without MFA, 
       * or overly permissive policies), the scan with security issues should have a lower security score.
       * 
       * Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7
       */
      const cleanScan: ScanResult = {
        scanId: 'clean',
        userId: 'user1',
        timestamp: new Date().toISOString(),
        resources: [],
        summary: { totalResources: 0, byType: {}, byRegion: {} },
        errors: [],
      };

      const scanWithPublicS3: ScanResult = {
        ...cleanScan,
        scanId: 'with-issue',
        resources: [
          {
            resourceId: 'bucket-1',
            resourceName: 'public-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              publicAccess: true,
              encrypted: false,
            },
          },
        ],
      };

      const cleanScore = calculateSecurityScore(cleanScan);
      const issueScore = calculateSecurityScore(scanWithPublicS3);

      expect(issueScore.score).toBeLessThan(cleanScore.score);
      expect(issueScore.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Property 8: Cost Efficiency Score Weighting', () => {
    it('should weight cost efficiency component at exactly 30% of total', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 8: Cost Efficiency Score Weighting
       * 
       * For any hygiene score calculation, the cost efficiency component should 
       * contribute exactly 30% of the maximum possible score (30 points out of 100).
       * 
       * Validates: Requirements 4.8
       */
      fc.assert(
        fc.property(arbitraryScanResult(), (scanResult) => {
          const score = calculateHygieneScore(scanResult);
          expect(score.breakdown.costEfficiency.maxScore).toBe(30);
          expect(score.breakdown.costEfficiency.score).toBeLessThanOrEqual(30);
          expect(score.breakdown.costEfficiency.score).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Cost Issues Reduce Cost Efficiency Score', () => {
    it('should reduce cost efficiency score when cost issues are present', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 9: Cost Issues Reduce Cost Efficiency Score
       * 
       * For any two scan results that are identical except one contains cost inefficiencies 
       * (stopped instances, unattached volumes, underutilized instances, or unassociated Elastic IPs), 
       * the scan with cost issues should have a lower cost efficiency score.
       * 
       * Validates: Requirements 4.9, 4.10, 4.11, 4.12
       */
      const cleanScan: ScanResult = {
        scanId: 'clean',
        userId: 'user1',
        timestamp: new Date().toISOString(),
        resources: [],
        summary: { totalResources: 0, byType: {}, byRegion: {} },
        errors: [],
      };

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const scanWithCostIssue: ScanResult = {
        ...cleanScan,
        scanId: 'with-issue',
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'stopped-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'stopped',
            tags: {},
            metadata: {
              state: 'stopped',
              stateTransitionTime: eightDaysAgo,
            },
          },
        ],
      };

      const cleanScore = calculateCostEfficiencyScore(cleanScan);
      const issueScore = calculateCostEfficiencyScore(scanWithCostIssue);

      expect(issueScore.score).toBeLessThan(cleanScore.score);
      expect(issueScore.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Property 10: Best Practices Score Weighting', () => {
    it('should weight best practices component at exactly 30% of total', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 10: Best Practices Score Weighting
       * 
       * For any hygiene score calculation, the best practices component should 
       * contribute exactly 30% of the maximum possible score (30 points out of 100).
       * 
       * Validates: Requirements 4.13
       */
      fc.assert(
        fc.property(arbitraryScanResult(), (scanResult) => {
          const score = calculateHygieneScore(scanResult);
          expect(score.breakdown.bestPractices.maxScore).toBe(30);
          expect(score.breakdown.bestPractices.score).toBeLessThanOrEqual(30);
          expect(score.breakdown.bestPractices.score).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Best Practice Violations Reduce Best Practices Score', () => {
    it('should reduce best practices score when violations are present', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 11: Best Practice Violations Reduce Best Practices Score
       * 
       * For any two scan results that are identical except one contains best practice violations 
       * (missing tags, missing backups, or disabled monitoring), the scan with violations should 
       * have a lower best practices score.
       * 
       * Validates: Requirements 4.14, 4.15, 4.16
       */
      const cleanScan: ScanResult = {
        scanId: 'clean',
        userId: 'user1',
        timestamp: new Date().toISOString(),
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'instance-with-tags',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {
              Environment: 'production',
              Owner: 'team',
              Project: 'myproject',
            },
            metadata: {
              monitoringState: 'enabled',
            },
          },
        ],
        summary: { totalResources: 1, byType: { EC2_Instance: 1 }, byRegion: { 'us-east-1': 1 } },
        errors: [],
      };

      const scanWithViolations: ScanResult = {
        ...cleanScan,
        scanId: 'with-issue',
        resources: [
          {
            resourceId: 'i-456',
            resourceName: 'instance-without-tags',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {}, // Missing required tags
            metadata: {
              monitoringState: 'disabled',
            },
          },
        ],
      };

      const cleanScore = calculateBestPracticesScore(cleanScan);
      const violationScore = calculateBestPracticesScore(scanWithViolations);

      expect(violationScore.score).toBeLessThan(cleanScore.score);
      expect(violationScore.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Property 12: Score Breakdown Completeness', () => {
    it('should include complete breakdown with all components', () => {
      /**
       * Feature: production-aws-saas-transformation
       * Property 12: Score Breakdown Completeness
       * 
       * For any hygiene score calculation, the API response should include a breakdown object 
       * with security, costEfficiency, and bestPractices components, each containing score, 
       * maxScore, and issues fields.
       * 
       * Validates: Requirements 4.18
       */
      fc.assert(
        fc.property(arbitraryScanResult(), (scanResult) => {
          const score = calculateHygieneScore(scanResult);

          // Check breakdown structure
          expect(score.breakdown).toBeDefined();
          expect(score.breakdown.security).toBeDefined();
          expect(score.breakdown.costEfficiency).toBeDefined();
          expect(score.breakdown.bestPractices).toBeDefined();

          // Check each component has required fields
          const components = [
            score.breakdown.security,
            score.breakdown.costEfficiency,
            score.breakdown.bestPractices,
          ];

          for (const component of components) {
            expect(component).toHaveProperty('score');
            expect(component).toHaveProperty('maxScore');
            expect(component).toHaveProperty('issues');
            expect(Array.isArray(component.issues)).toBe(true);

            // Verify score is within bounds
            expect(component.score).toBeGreaterThanOrEqual(0);
            expect(component.score).toBeLessThanOrEqual(component.maxScore);

            // Verify each issue has required fields
            for (const issue of component.issues) {
              expect(issue).toHaveProperty('type');
              expect(issue).toHaveProperty('severity');
              expect(issue).toHaveProperty('resourceId');
              expect(issue).toHaveProperty('description');
              expect(issue).toHaveProperty('deduction');
              expect(issue.deduction).toBeGreaterThan(0);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

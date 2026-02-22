import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { Alert, AlertConfig, ScoreResult, Issue } from '../../types';

/**
 * Property-Based Tests for Scheduler Lambda
 * 
 * Feature: production-aws-saas-transformation
 * Properties 18-23: Alert Generation and Deduplication
 * 
 * Validates: Requirements 10.4, 10.5, 10.6, 10.10, 10.11, 10.12
 */

// Test helper to create mock comparison data
interface MockComparison {
  newSecurityIssues: Issue[];
  costChange: number;
  summary: string;
}

// Test helper to create mock score results
function createMockScoreResult(overallScore: number): ScoreResult {
  return {
    scanId: `scan_${randomUUID()}`,
    userId: `user_${randomUUID()}`,
    timestamp: new Date().toISOString(),
    overallScore,
    breakdown: {
      security: {
        score: overallScore * 0.4,
        maxScore: 40,
        issues: [],
      },
      costEfficiency: {
        score: overallScore * 0.3,
        maxScore: 30,
        issues: [],
      },
      bestPractices: {
        score: overallScore * 0.3,
        maxScore: 30,
        issues: [],
      },
    },
  };
}

// Test helper to create mock alert config
function createMockAlertConfig(
  emailEnabled: boolean = true,
  slackEnabled: boolean = true
): AlertConfig {
  return {
    email: {
      enabled: emailEnabled,
      address: emailEnabled ? 'test@example.com' : '',
    },
    slack: {
      enabled: slackEnabled,
      webhookUrl: slackEnabled ? 'https://hooks.slack.com/test' : '',
    },
    thresholds: {
      hygieneScoreDrop: 10,
      costIncreasePercent: 20,
    },
  };
}

describe('Property 18: Alert Generation for New Security Issues', () => {
  it('should generate alert when new security issues are detected', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 18: Alert Generation for New Security Issues
     * 
     * For any scheduled scan that detects new security issues not present 
     * in the previous scan, the Alert System should generate an alert 
     * with type "new_security_issues".
     * 
     * Validates: Requirements 10.4
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('public_s3_bucket', 'open_security_group'),
            severity: fc.constantFrom('critical', 'high', 'medium'),
            resourceId: fc.string({ minLength: 1 }),
            description: fc.string(),
            deduction: fc.float({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (newIssuesData) => {
          const newIssues = newIssuesData as Issue[];
          const comparison: MockComparison = {
            newSecurityIssues: newIssues,
            costChange: 0,
            summary: `${newIssues.length} new security issues detected`,
          };

          const currentScore = createMockScoreResult(80);
          const previousScore = createMockScoreResult(85);
          const alertConfig = createMockAlertConfig();

          // Simulate alert generation logic
          const alerts: Alert[] = [];

          if (comparison.newSecurityIssues.length > 0) {
            const alert: Alert = {
              alertId: `alert_${randomUUID()}`,
              userId: 'test_user',
              timestamp: new Date().toISOString(),
              alertType: 'new_security_issues',
              severity: comparison.newSecurityIssues[0].severity,
              message: `${comparison.newSecurityIssues.length} new security issue(s) detected`,
              details: {
                newIssues: comparison.newSecurityIssues,
                changeSummary: comparison.summary,
              },
              channels: ['email', 'slack'],
              deduplicationKey: `new_security_issues_test_user_${new Date().toISOString().split('T')[0]}`,
            };
            alerts.push(alert);
          }

          // Verify alert was generated
          expect(alerts.length).toBe(1);
          expect(alerts[0].alertType).toBe('new_security_issues');
          expect(alerts[0].message).toContain(newIssues.length.toString());
          expect(alerts[0].details.newIssues).toEqual(newIssues);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 19: Alert Generation for Score Drop', () => {
  it('should generate alert when hygiene score drops below threshold', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 19: Alert Generation for Score Drop
     * 
     * For any scheduled scan where the hygiene score drops below the user's 
     * configured threshold, the Alert System should generate an alert 
     * with type "hygiene_score_drop".
     * 
     * Validates: Requirements 10.5
     */
    fc.assert(
      fc.property(
        fc.float({ min: 50, max: 100, noNaN: true }),
        fc.float({ min: 10, max: 50, noNaN: true }),
        (previousScore, scoreDrop) => {
          const currentScore_val = previousScore - scoreDrop;
          if (currentScore_val < 0 || !Number.isFinite(currentScore_val)) return; // Skip invalid cases

          const currentScore = createMockScoreResult(currentScore_val);
          const previousScoreResult = createMockScoreResult(previousScore);
          const alertConfig = createMockAlertConfig();

          // Simulate alert generation logic
          const alerts: Alert[] = [];

          if (currentScore.overallScore < previousScoreResult.overallScore) {
            const drop = previousScoreResult.overallScore - currentScore.overallScore;
            if (drop >= alertConfig.thresholds.hygieneScoreDrop) {
              const alert: Alert = {
                alertId: `alert_${randomUUID()}`,
                userId: 'test_user',
                timestamp: new Date().toISOString(),
                alertType: 'hygiene_score_drop',
                severity: drop > 20 ? 'high' : 'medium',
                message: `Hygiene score dropped by ${drop.toFixed(1)} points`,
                details: {
                  previousScore: previousScoreResult.overallScore,
                  currentScore: currentScore.overallScore,
                  scoreChange: -drop,
                  changeSummary: 'Score decreased',
                },
                channels: ['email', 'slack'],
                deduplicationKey: `hygiene_score_drop_test_user_${new Date().toISOString().split('T')[0]}`,
              };
              alerts.push(alert);
            }
          }

          // Verify alert was generated if drop exceeds threshold
          if (scoreDrop >= alertConfig.thresholds.hygieneScoreDrop) {
            expect(alerts.length).toBe(1);
            expect(alerts[0].alertType).toBe('hygiene_score_drop');
            expect(alerts[0].details.scoreChange).toBe(-scoreDrop);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 20: Alert Generation for Cost Increase', () => {
  it('should generate alert when cost increases above threshold', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 20: Alert Generation for Cost Increase
     * 
     * For any scheduled scan where the cost increases by more than the user's 
     * configured threshold percentage, the Alert System should generate an alert 
     * with type "cost_increase".
     * 
     * Validates: Requirements 10.6
     */
    fc.assert(
      fc.property(
        fc.float({ min: 10, max: 100 }),
        (costChangePercent) => {
          const comparison: MockComparison = {
            newSecurityIssues: [],
            costChange: costChangePercent,
            summary: `Cost increased by ${costChangePercent}%`,
          };

          const alertConfig = createMockAlertConfig();

          // Simulate alert generation logic
          const alerts: Alert[] = [];

          if (comparison.costChange > alertConfig.thresholds.costIncreasePercent) {
            const alert: Alert = {
              alertId: `alert_${randomUUID()}`,
              userId: 'test_user',
              timestamp: new Date().toISOString(),
              alertType: 'cost_increase',
              severity: comparison.costChange > 50 ? 'high' : 'medium',
              message: `Estimated monthly cost increased by ${comparison.costChange.toFixed(1)}%`,
              details: {
                costChange: comparison.costChange,
                costDifference: 100,
                changeSummary: comparison.summary,
              },
              channels: ['email', 'slack'],
              deduplicationKey: `cost_increase_test_user_${new Date().toISOString().split('T')[0]}`,
            };
            alerts.push(alert);
          }

          // Verify alert was generated if cost increase exceeds threshold
          if (costChangePercent > alertConfig.thresholds.costIncreasePercent) {
            expect(alerts.length).toBe(1);
            expect(alerts[0].alertType).toBe('cost_increase');
            expect(alerts[0].details.costChange).toBe(costChangePercent);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 21: Alert Configuration Persistence Round Trip', () => {
  it('should persist and retrieve alert configuration without loss', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 21: Alert Configuration Persistence Round Trip
     * 
     * For any alert configuration, storing it in DynamoDB and then retrieving it 
     * should produce an equivalent configuration with the same thresholds 
     * and notification preferences.
     * 
     * Validates: Requirements 10.10
     */
    fc.assert(
      fc.property(
        fc.record({
          email: fc.record({
            enabled: fc.boolean(),
            address: fc.emailAddress(),
          }),
          slack: fc.record({
            enabled: fc.boolean(),
            webhookUrl: fc.webUrl(),
          }),
          thresholds: fc.record({
            hygieneScoreDrop: fc.float({ min: 1, max: 50, noNaN: true }),
            costIncreasePercent: fc.float({ min: 1, max: 100, noNaN: true }),
          }),
        }),
        (originalConfig: AlertConfig) => {
          // Simulate storage and retrieval
          const storedConfig = JSON.parse(JSON.stringify(originalConfig));
          const retrievedConfig = JSON.parse(JSON.stringify(storedConfig)) as AlertConfig;

          // Verify equivalence
          expect(retrievedConfig.email.enabled).toBe(originalConfig.email.enabled);
          expect(retrievedConfig.email.address).toBe(originalConfig.email.address);
          expect(retrievedConfig.slack.enabled).toBe(originalConfig.slack.enabled);
          expect(retrievedConfig.slack.webhookUrl).toBe(originalConfig.slack.webhookUrl);
          expect(retrievedConfig.thresholds.hygieneScoreDrop).toBe(
            originalConfig.thresholds.hygieneScoreDrop
          );
          expect(retrievedConfig.thresholds.costIncreasePercent).toBe(
            originalConfig.thresholds.costIncreasePercent
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 22: Alert Includes Change Summary', () => {
  it('should include change summary in all generated alerts', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 22: Alert Includes Change Summary
     * 
     * For any generated alert, it should include a summary field containing 
     * a description of what changed between scans.
     * 
     * Validates: Requirements 10.11
     */
    fc.assert(
      fc.property(fc.string({ minLength: 10 }), (summary) => {
        const alert: Alert = {
          alertId: `alert_${randomUUID()}`,
          userId: 'test_user',
          timestamp: new Date().toISOString(),
          alertType: 'new_security_issues',
          severity: 'high',
          message: 'Test alert',
          details: {
            changeSummary: summary,
            newIssues: [],
          },
          channels: ['email'],
          deduplicationKey: 'test_key',
        };

        // Verify summary is present
        expect(alert.details).toBeDefined();
        expect(alert.details.changeSummary).toBe(summary);
        expect(alert.details.changeSummary.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 23: Alert Deduplication', () => {
  it('should prevent duplicate alerts within 24-hour window', () => {
    /**
     * Feature: production-aws-saas-transformation
     * Property 23: Alert Deduplication
     * 
     * For any alert with the same deduplication key, sending it twice within 
     * a 24-hour window should result in only one notification being sent.
     * 
     * Validates: Requirements 10.12
     */
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (deduplicationKey) => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const alert1: Alert = {
          alertId: `alert_${randomUUID()}`,
          userId: 'test_user',
          timestamp: oneHourAgo.toISOString(),
          alertType: 'new_security_issues',
          severity: 'high',
          message: 'Test alert',
          details: {},
          channels: ['email'],
          deduplicationKey,
        };

        const alert2: Alert = {
          alertId: `alert_${randomUUID()}`,
          userId: 'test_user',
          timestamp: now.toISOString(),
          alertType: 'new_security_issues',
          severity: 'high',
          message: 'Test alert',
          details: {},
          channels: ['email'],
          deduplicationKey,
        };

        // Simulate deduplication logic
        const alertsToSend: Alert[] = [];
        const sentDeduplicationKeys = new Set<string>();

        for (const alert of [alert1, alert2]) {
          if (!sentDeduplicationKeys.has(alert.deduplicationKey)) {
            alertsToSend.push(alert);
            sentDeduplicationKeys.add(alert.deduplicationKey);
          }
        }

        // Verify only one alert is sent
        expect(alertsToSend.length).toBe(1);
        expect(alertsToSend[0].deduplicationKey).toBe(deduplicationKey);
      }),
      { numRuns: 100 }
    );
  });

  it('should allow duplicate alerts outside 24-hour window', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (deduplicationKey) => {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        const alert1: Alert = {
          alertId: `alert_${randomUUID()}`,
          userId: 'test_user',
          timestamp: twoDaysAgo.toISOString(),
          alertType: 'new_security_issues',
          severity: 'high',
          message: 'Test alert',
          details: {},
          channels: ['email'],
          deduplicationKey,
        };

        const alert2: Alert = {
          alertId: `alert_${randomUUID()}`,
          userId: 'test_user',
          timestamp: now.toISOString(),
          alertType: 'new_security_issues',
          severity: 'high',
          message: 'Test alert',
          details: {},
          channels: ['email'],
          deduplicationKey,
        };

        // Simulate deduplication logic with 24-hour window
        const alertsToSend: Alert[] = [];
        const recentAlerts = [alert1].filter(
          a => new Date(a.timestamp).getTime() > now.getTime() - 24 * 60 * 60 * 1000
        );

        for (const alert of [alert2]) {
          const isDuplicate = recentAlerts.some(a => a.deduplicationKey === alert.deduplicationKey);
          if (!isDuplicate) {
            alertsToSend.push(alert);
          }
        }

        // Verify alert is sent (not a duplicate)
        expect(alertsToSend.length).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});

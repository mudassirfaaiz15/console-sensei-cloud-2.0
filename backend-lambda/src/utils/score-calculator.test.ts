import { describe, it, expect } from 'vitest';
import { calculateHygieneScore, calculateSecurityScore, calculateCostEfficiencyScore, calculateBestPracticesScore } from './score-calculator';
import { ScanResult } from '../types';

describe('Score Calculator', () => {
  const createMockScanResult = (overrides?: Partial<ScanResult>): ScanResult => ({
    scanId: 'scan-123',
    userId: 'user-456',
    timestamp: '2024-01-15T10:00:00Z',
    resources: [],
    summary: {
      totalResources: 0,
      byType: {},
      byRegion: {},
    },
    errors: [],
    ...overrides,
  });

  describe('calculateHygieneScore', () => {
    it('should calculate overall score with correct structure', () => {
      const scanResult = createMockScanResult();
      const result = calculateHygieneScore(scanResult);

      expect(result).toHaveProperty('scanId', 'scan-123');
      expect(result).toHaveProperty('userId', 'user-456');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('security');
      expect(result.breakdown).toHaveProperty('costEfficiency');
      expect(result.breakdown).toHaveProperty('bestPractices');
    });

    it('should calculate score between 0 and 100', () => {
      const scanResult = createMockScanResult();
      const result = calculateHygieneScore(scanResult);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should return perfect score for empty scan result', () => {
      const scanResult = createMockScanResult();
      const result = calculateHygieneScore(scanResult);

      // With no resources and no issues, should get perfect score
      expect(result.overallScore).toBe(100);
      expect(result.breakdown.security.score).toBe(40);
      expect(result.breakdown.costEfficiency.score).toBe(30);
      expect(result.breakdown.bestPractices.score).toBe(30);
    });

    it('should have correct max scores for each component', () => {
      const scanResult = createMockScanResult();
      const result = calculateHygieneScore(scanResult);

      expect(result.breakdown.security.maxScore).toBe(40);
      expect(result.breakdown.costEfficiency.maxScore).toBe(30);
      expect(result.breakdown.bestPractices.maxScore).toBe(30);
    });
  });

  describe('calculateSecurityScore', () => {
    it('should return security component with correct structure', () => {
      const scanResult = createMockScanResult();
      const result = calculateSecurityScore(scanResult);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore', 40);
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return perfect security score for empty scan', () => {
      const scanResult = createMockScanResult();
      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(40);
      expect(result.issues).toHaveLength(0);
    });

    it('should not return negative scores', () => {
      const scanResult = createMockScanResult();
      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should deduct points for public S3 bucket without encryption', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'bucket-1',
            resourceName: 'my-public-bucket',
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
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(35); // 40 - 5
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('public_s3_bucket_unencrypted');
      expect(result.issues[0].severity).toBe('high');
      expect(result.issues[0].deduction).toBe(5);
      expect(result.issues[0].fixGuide).toBeDefined();
    });

    it('should not deduct for public S3 bucket with encryption', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'bucket-1',
            resourceName: 'my-public-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              publicAccess: true,
              encrypted: true,
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(40);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for security group with 0.0.0.0/0 on SSH port', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'sg-123',
            resourceName: 'my-security-group',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              ingressRules: [
                {
                  cidr: '0.0.0.0/0',
                  fromPort: 22,
                  toPort: 22,
                  protocol: 'tcp',
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(36); // 40 - 4
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('open_security_group');
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].deduction).toBe(4);
    });

    it('should deduct points for security group with 0.0.0.0/0 on RDP port', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'sg-123',
            resourceName: 'my-security-group',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              ingressRules: [
                {
                  cidr: '0.0.0.0/0',
                  fromPort: 3389,
                  toPort: 3389,
                  protocol: 'tcp',
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(36); // 40 - 4
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('open_security_group');
    });

    it('should deduct points for security group with 0.0.0.0/0 on MySQL port', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'sg-123',
            resourceName: 'my-security-group',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              ingressRules: [
                {
                  cidr: '0.0.0.0/0',
                  fromPort: 3306,
                  toPort: 3306,
                  protocol: 'tcp',
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(36); // 40 - 4
      expect(result.issues).toHaveLength(1);
    });

    it('should deduct points for security group with 0.0.0.0/0 on PostgreSQL port', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'sg-123',
            resourceName: 'my-security-group',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              ingressRules: [
                {
                  cidr: '0.0.0.0/0',
                  fromPort: 5432,
                  toPort: 5432,
                  protocol: 'tcp',
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(36); // 40 - 4
      expect(result.issues).toHaveLength(1);
    });

    it('should not deduct for security group with specific IP on sensitive port', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'sg-123',
            resourceName: 'my-security-group',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              ingressRules: [
                {
                  cidr: '10.0.0.0/8',
                  fromPort: 22,
                  toPort: 22,
                  protocol: 'tcp',
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(40);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for unencrypted EBS volume', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'vol-123',
            resourceName: 'my-volume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'in-use',
            tags: {},
            metadata: {
              encrypted: false,
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(37); // 40 - 3
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('unencrypted_ebs_volume');
      expect(result.issues[0].severity).toBe('medium');
      expect(result.issues[0].deduction).toBe(3);
    });

    it('should not deduct for encrypted EBS volume', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'vol-123',
            resourceName: 'my-volume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'in-use',
            tags: {},
            metadata: {
              encrypted: true,
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(40);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for IAM user without MFA', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'user-123',
            resourceName: 'john.doe',
            resourceType: 'IAM_User',
            region: 'global',
            state: 'active',
            tags: {},
            metadata: {
              mfaEnabled: false,
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(37); // 40 - 3
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('iam_user_no_mfa');
      expect(result.issues[0].severity).toBe('high');
      expect(result.issues[0].deduction).toBe(3);
    });

    it('should not deduct for IAM user with MFA', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'user-123',
            resourceName: 'john.doe',
            resourceType: 'IAM_User',
            region: 'global',
            state: 'active',
            tags: {},
            metadata: {
              mfaEnabled: true,
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(40);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for overly permissive IAM policy on user', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'user-123',
            resourceName: 'admin-user',
            resourceType: 'IAM_User',
            region: 'global',
            state: 'active',
            tags: {},
            metadata: {
              mfaEnabled: true,
              policies: [
                {
                  document: {
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: '*',
                        Resource: '*',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(35); // 40 - 5
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('overly_permissive_iam_policy');
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].deduction).toBe(5);
    });

    it('should deduct points for overly permissive IAM policy on role', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'role-123',
            resourceName: 'admin-role',
            resourceType: 'IAM_Role',
            region: 'global',
            state: 'active',
            tags: {},
            metadata: {
              policies: [
                {
                  document: {
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: '*',
                        Resource: '*',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(35); // 40 - 5
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('overly_permissive_iam_policy');
    });

    it('should handle multiple security issues', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'bucket-1',
            resourceName: 'my-public-bucket',
            resourceType: 'S3_Bucket',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              publicAccess: true,
              encrypted: false,
            },
          },
          {
            resourceId: 'sg-123',
            resourceName: 'my-security-group',
            resourceType: 'Security_Group',
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              ingressRules: [
                {
                  cidr: '0.0.0.0/0',
                  fromPort: 22,
                  toPort: 22,
                  protocol: 'tcp',
                },
              ],
            },
          },
          {
            resourceId: 'vol-123',
            resourceName: 'my-volume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'in-use',
            tags: {},
            metadata: {
              encrypted: false,
            },
          },
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(28); // 40 - 5 - 4 - 3
      expect(result.issues).toHaveLength(3);
    });

    it('should not go below 0 score even with many issues', () => {
      const scanResult = createMockScanResult({
        resources: [
          ...Array.from({ length: 10 }, (_, i) => ({
            resourceId: `bucket-${i}`,
            resourceName: `bucket-${i}`,
            resourceType: 'S3_Bucket' as const,
            region: 'us-east-1',
            state: 'active',
            tags: {},
            metadata: {
              publicAccess: true,
              encrypted: false,
            },
          })),
        ],
      });

      const result = calculateSecurityScore(scanResult);

      expect(result.score).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateCostEfficiencyScore', () => {
    it('should return cost efficiency component with correct structure', () => {
      const scanResult = createMockScanResult();
      const result = calculateCostEfficiencyScore(scanResult);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore', 30);
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return perfect cost efficiency score for empty scan', () => {
      const scanResult = createMockScanResult();
      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should not return negative scores', () => {
      const scanResult = createMockScanResult();
      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should deduct points for stopped EC2 instance older than 7 days', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'my-stopped-instance',
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
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(27); // 30 - 3
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('stopped_instance_old');
      expect(result.issues[0].severity).toBe('medium');
      expect(result.issues[0].deduction).toBe(3);
      expect(result.issues[0].fixGuide).toBeDefined();
    });

    it('should not deduct for stopped EC2 instance less than 7 days old', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'my-stopped-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'stopped',
            tags: {},
            metadata: {
              state: 'stopped',
              stateTransitionTime: twoDaysAgo,
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should not deduct for running EC2 instance', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'my-running-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {},
            metadata: {
              state: 'running',
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for unattached EBS volume', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'vol-123',
            resourceName: 'my-unattached-volume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'available',
            tags: {},
            metadata: {
              state: 'available',
              attachments: [],
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(28); // 30 - 2
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('unattached_ebs_volume');
      expect(result.issues[0].severity).toBe('low');
      expect(result.issues[0].deduction).toBe(2);
      expect(result.issues[0].fixGuide).toBeDefined();
    });

    it('should not deduct for attached EBS volume', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'vol-123',
            resourceName: 'my-attached-volume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'in-use',
            tags: {},
            metadata: {
              state: 'in-use',
              attachments: [
                {
                  instanceId: 'i-123',
                  device: '/dev/sda1',
                },
              ],
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for oversized instance with low CPU utilization', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'my-oversized-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {},
            metadata: {
              state: 'running',
              instanceType: 't3.xlarge',
              cpuUtilization: 10,
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(26); // 30 - 4
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('oversized_instance');
      expect(result.issues[0].severity).toBe('medium');
      expect(result.issues[0].deduction).toBe(4);
      expect(result.issues[0].fixGuide).toBeDefined();
    });

    it('should not deduct for instance with normal CPU utilization', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'my-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {},
            metadata: {
              state: 'running',
              instanceType: 't3.medium',
              cpuUtilization: 50,
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should not deduct for stopped instance with low CPU (not running)', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'i-123',
            resourceName: 'my-stopped-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'stopped',
            tags: {},
            metadata: {
              state: 'stopped',
              instanceType: 't3.xlarge',
              cpuUtilization: 5,
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should deduct points for unassociated Elastic IP', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'eipalloc-123',
            resourceName: 'my-elastic-ip',
            resourceType: 'Elastic_IP',
            region: 'us-east-1',
            state: 'available',
            tags: {},
            metadata: {
              publicIp: '54.123.45.67',
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(28); // 30 - 2
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('unassociated_elastic_ip');
      expect(result.issues[0].severity).toBe('low');
      expect(result.issues[0].deduction).toBe(2);
      expect(result.issues[0].fixGuide).toBeDefined();
    });

    it('should not deduct for associated Elastic IP', () => {
      const scanResult = createMockScanResult({
        resources: [
          {
            resourceId: 'eipalloc-123',
            resourceName: 'my-elastic-ip',
            resourceType: 'Elastic_IP',
            region: 'us-east-1',
            state: 'associated',
            tags: {},
            metadata: {
              publicIp: '54.123.45.67',
              associationId: 'eipassoc-456',
              instanceId: 'i-789',
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle multiple cost efficiency issues', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const scanResult = createMockScanResult({
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
          {
            resourceId: 'vol-123',
            resourceName: 'unattached-volume',
            resourceType: 'EBS_Volume',
            region: 'us-east-1',
            state: 'available',
            tags: {},
            metadata: {
              state: 'available',
              attachments: [],
            },
          },
          {
            resourceId: 'i-456',
            resourceName: 'oversized-instance',
            resourceType: 'EC2_Instance',
            region: 'us-east-1',
            state: 'running',
            tags: {},
            metadata: {
              state: 'running',
              instanceType: 't3.xlarge',
              cpuUtilization: 5,
            },
          },
          {
            resourceId: 'eipalloc-123',
            resourceName: 'unassociated-eip',
            resourceType: 'Elastic_IP',
            region: 'us-east-1',
            state: 'available',
            tags: {},
            metadata: {
              publicIp: '54.123.45.67',
            },
          },
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(19); // 30 - 3 - 2 - 4 - 2
      expect(result.issues).toHaveLength(4);
    });

    it('should not go below 0 score even with many issues', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const scanResult = createMockScanResult({
        resources: [
          ...Array.from({ length: 10 }, (_, i) => ({
            resourceId: `i-${i}`,
            resourceName: `stopped-instance-${i}`,
            resourceType: 'EC2_Instance' as const,
            region: 'us-east-1',
            state: 'stopped',
            tags: {},
            metadata: {
              state: 'stopped',
              stateTransitionTime: eightDaysAgo,
            },
          })),
        ],
      });

      const result = calculateCostEfficiencyScore(scanResult);

      expect(result.score).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateBestPracticesScore', () => {
    it('should return best practices component with correct structure', () => {
      const scanResult = createMockScanResult();
      const result = calculateBestPracticesScore(scanResult);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore', 30);
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return perfect best practices score for empty scan', () => {
      const scanResult = createMockScanResult();
      const result = calculateBestPracticesScore(scanResult);

      expect(result.score).toBe(30);
      expect(result.issues).toHaveLength(0);
    });

    it('should not return negative scores', () => {
      const scanResult = createMockScanResult();
      const result = calculateBestPracticesScore(scanResult);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});

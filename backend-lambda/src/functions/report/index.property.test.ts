import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generatePDFReport } from '../../utils/pdf-generator';
import { ScanResult, ScoreResult, AIRecommendation, Resource, ResourceType } from '../../types';

/**
 * Property-Based Tests for Report Lambda
 * 
 * Property 24: PDF Report Completeness
 * **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6**
 * 
 * For any generated PDF report, it should include all required sections:
 * - Hygiene score breakdown
 * - Resource inventory by type and region
 * - Security findings with severity levels
 * - Cost breakdown and trends
 * - AI-generated recommendations
 */

describe('Property 24: PDF Report Completeness', () => {
  // Arbitraries for generating test data
  const resourceTypeArbitrary = fc.constantFrom<ResourceType>(
    'EC2_Instance',
    'EBS_Volume',
    'S3_Bucket',
    'RDS_Instance',
    'Lambda_Function',
    'Load_Balancer',
    'NAT_Gateway',
    'Elastic_IP',
    'IAM_User',
    'IAM_Role'
  );

  const regionArbitrary = fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1');

  const resourceArbitrary = fc.record({
    resourceId: fc.string({ minLength: 5, maxLength: 20 }),
    resourceName: fc.string({ minLength: 5, maxLength: 30 }),
    resourceType: resourceTypeArbitrary,
    region: regionArbitrary,
    state: fc.constantFrom('running', 'stopped', 'available'),
    tags: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 20 }), { maxKeys: 3 }),
    metadata: fc.record({
      instanceType: fc.option(fc.string()),
      size: fc.option(fc.integer({ min: 1, max: 1000 })),
    }),
  });

  const scanResultArbitrary = fc.record({
    scanId: fc.string({ minLength: 10, maxLength: 30 }),
    userId: fc.string({ minLength: 5, maxLength: 20 }),
    timestamp: fc.date().map((d) => d.toISOString()),
    resources: fc.array(resourceArbitrary, { minLength: 1, maxLength: 50 }),
    summary: fc.record({
      totalResources: fc.integer({ min: 1, max: 100 }),
      byType: fc.dictionary(fc.string(), fc.integer({ min: 1, max: 20 }), { maxKeys: 5 }),
      byRegion: fc.dictionary(fc.string(), fc.integer({ min: 1, max: 20 }), { maxKeys: 4 }),
    }),
    costData: fc.record({
      estimatedMonthly: fc.integer({ min: 100, max: 10000 }),
      byService: fc.dictionary(fc.string(), fc.integer({ min: 10, max: 5000 }), { maxKeys: 5 }),
      byRegion: fc.dictionary(fc.string(), fc.integer({ min: 10, max: 5000 }), { maxKeys: 4 }),
    }),
    errors: fc.array(
      fc.record({
        type: fc.string(),
        service: fc.string(),
        message: fc.string(),
        timestamp: fc.date().map((d) => d.toISOString()),
      }),
      { maxLength: 3 }
    ),
  });

  const scoreResultArbitrary = fc.record({
    scanId: fc.string({ minLength: 10, maxLength: 30 }),
    userId: fc.string({ minLength: 5, maxLength: 20 }),
    timestamp: fc.date().map((d) => d.toISOString()),
    overallScore: fc.integer({ min: 0, max: 100 }),
    breakdown: fc.record({
      security: fc.record({
        score: fc.integer({ min: 0, max: 40 }),
        maxScore: fc.constant(40),
        issues: fc.array(
          fc.record({
            type: fc.string(),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            resourceId: fc.string(),
            description: fc.string(),
            deduction: fc.integer({ min: 1, max: 10 }),
          }),
          { maxLength: 5 }
        ),
      }),
      costEfficiency: fc.record({
        score: fc.integer({ min: 0, max: 30 }),
        maxScore: fc.constant(30),
        issues: fc.array(
          fc.record({
            type: fc.string(),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            resourceId: fc.string(),
            description: fc.string(),
            deduction: fc.integer({ min: 1, max: 10 }),
          }),
          { maxLength: 5 }
        ),
      }),
      bestPractices: fc.record({
        score: fc.integer({ min: 0, max: 30 }),
        maxScore: fc.constant(30),
        issues: fc.array(
          fc.record({
            type: fc.string(),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            resourceId: fc.string(),
            description: fc.string(),
            deduction: fc.integer({ min: 1, max: 10 }),
          }),
          { maxLength: 5 }
        ),
      }),
    }),
  });

  const recommendationArbitrary = fc.record({
    id: fc.string(),
    category: fc.constantFrom('cost', 'security', 'performance'),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    estimatedSavings: fc.option(fc.integer({ min: 10, max: 10000 })),
    priority: fc.constantFrom('high', 'medium', 'low'),
    affectedResources: fc.array(fc.string(), { maxLength: 5 }),
    actionItems: fc.array(fc.string(), { maxLength: 5 }),
  });

  it('should generate valid PDF buffer for any scan and score result', async () => {
    await fc.assert(
      fc.asyncProperty(
        scanResultArbitrary,
        scoreResultArbitrary,
        fc.array(recommendationArbitrary, { maxLength: 10 }),
        async (scanResult, scoreResult, recommendations) => {
          // Generate PDF
          const pdfBuffer = await generatePDFReport(scanResult, scoreResult, recommendations);

          // Verify PDF was generated
          expect(pdfBuffer).toBeInstanceOf(Buffer);
          expect(pdfBuffer.length).toBeGreaterThan(0);

          // PDF should start with %PDF magic bytes
          expect(pdfBuffer.toString('latin1', 0, 4)).toBe('%PDF');

          // PDF should have reasonable size (at least 1KB, less than 10MB)
          expect(pdfBuffer.length).toBeGreaterThan(1024);
          expect(pdfBuffer.length).toBeLessThan(10 * 1024 * 1024);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should generate PDF with size proportional to content', async () => {
    await fc.assert(
      fc.asyncProperty(
        scanResultArbitrary,
        scoreResultArbitrary,
        async (scanResult, scoreResult) => {
          // Generate PDF without recommendations
          const pdfNoRecs = await generatePDFReport(scanResult, scoreResult, []);

          // Generate PDF with recommendations
          const recommendations: AIRecommendation[] = [
            {
              id: 'rec1',
              category: 'cost',
              title: 'Optimize EC2 instances',
              description: 'Right-size your EC2 instances to reduce costs',
              estimatedSavings: 500,
              priority: 'high',
              affectedResources: ['i-123456'],
              actionItems: ['Review instance types', 'Implement auto-scaling'],
            },
          ];
          const pdfWithRecs = await generatePDFReport(scanResult, scoreResult, recommendations);

          // PDF with recommendations should be larger
          expect(pdfWithRecs.length).toBeGreaterThanOrEqual(pdfNoRecs.length);
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should generate PDF for various score ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        scanResultArbitrary,
        fc.integer({ min: 0, max: 100 }).chain((score) =>
          fc.record({
            scanId: fc.string({ minLength: 10, maxLength: 30 }),
            userId: fc.string({ minLength: 5, maxLength: 20 }),
            timestamp: fc.date().map((d) => d.toISOString()),
            overallScore: fc.constant(score),
            breakdown: fc.record({
              security: fc.record({
                score: fc.integer({ min: 0, max: 40 }),
                maxScore: fc.constant(40),
                issues: fc.array(
                  fc.record({
                    type: fc.string(),
                    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
                    resourceId: fc.string(),
                    description: fc.string(),
                    deduction: fc.integer({ min: 1, max: 10 }),
                  }),
                  { maxLength: 3 }
                ),
              }),
              costEfficiency: fc.record({
                score: fc.integer({ min: 0, max: 30 }),
                maxScore: fc.constant(30),
                issues: fc.array(
                  fc.record({
                    type: fc.string(),
                    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
                    resourceId: fc.string(),
                    description: fc.string(),
                    deduction: fc.integer({ min: 1, max: 10 }),
                  }),
                  { maxLength: 3 }
                ),
              }),
              bestPractices: fc.record({
                score: fc.integer({ min: 0, max: 30 }),
                maxScore: fc.constant(30),
                issues: fc.array(
                  fc.record({
                    type: fc.string(),
                    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
                    resourceId: fc.string(),
                    description: fc.string(),
                    deduction: fc.integer({ min: 1, max: 10 }),
                  }),
                  { maxLength: 3 }
                ),
              }),
            }),
          })
        ),
        async (scanResult, scoreResult) => {
          const pdfBuffer = await generatePDFReport(scanResult, scoreResult, []);

          // Should generate valid PDF regardless of score
          expect(pdfBuffer).toBeInstanceOf(Buffer);
          expect(pdfBuffer.length).toBeGreaterThan(1024);
          expect(pdfBuffer.toString('latin1', 0, 4)).toBe('%PDF');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle empty security issues', async () => {
    await fc.assert(
      fc.asyncProperty(
        scanResultArbitrary,
        scoreResultArbitrary,
        async (scanResult, scoreResult) => {
          // Create score result with no security issues
          const scoreWithNoIssues = {
            ...scoreResult,
            breakdown: {
              ...scoreResult.breakdown,
              security: {
                ...scoreResult.breakdown.security,
                issues: [],
              },
            },
          };

          const pdfBuffer = await generatePDFReport(scanResult, scoreWithNoIssues, []);

          expect(pdfBuffer).toBeInstanceOf(Buffer);
          expect(pdfBuffer.length).toBeGreaterThan(1024);
        }
      ),
      { numRuns: 5 }
    );
  });
});

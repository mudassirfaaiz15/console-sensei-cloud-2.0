# ConsoleSensei Backend Lambda Functions

This directory contains the AWS Lambda functions and infrastructure code for the ConsoleSensei Cloud platform.

## Architecture

The backend is built on AWS serverless infrastructure:

- **Lambda Functions**: Node.js 18 TypeScript functions for compute
- **API Gateway**: REST API with Cognito authentication
- **DynamoDB**: NoSQL database for data persistence
- **S3**: Object storage for reports and diagrams
- **Cognito**: User authentication and authorization
- **EventBridge**: Scheduled scan triggers
- **CloudWatch**: Logging and monitoring
- **X-Ray**: Distributed tracing

## Project Structure

```
backend-lambda/
├── infrastructure/          # AWS CDK infrastructure code
│   ├── app.ts              # CDK app entry point
│   └── stack.ts            # Main infrastructure stack
├── src/
│   ├── functions/          # Lambda function handlers
│   │   ├── scan/           # Resource scanning
│   │   ├── score/          # Hygiene score calculation
│   │   ├── ai/             # AI-powered features
│   │   ├── report/         # Report generation
│   │   └── scheduler/      # Scheduled scans and alerts
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Shared utilities
├── tests/                  # Unit and property-based tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── cdk.json
```

## Prerequisites

- Node.js 18 or later
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- TypeScript (`npm install -g typescript`)

## Installation

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Build TypeScript
npm run build
```

## Development

```bash
# Watch mode for TypeScript compilation
npm run watch

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests only
npm run test:property
```

## Deployment

```bash
# Synthesize CloudFormation template
npm run synth

# Deploy to AWS
npm run deploy

# Or deploy with CDK directly
cdk deploy
```

## Infrastructure Components

### DynamoDB Tables

1. **ScanResults** - Stores AWS resource scan results
   - Partition Key: `scanId`
   - GSI: `userId` + `timestamp`
   - TTL: 90 days

2. **Users** - Stores user preferences and configurations
   - Partition Key: `userId`

3. **HygieneScores** - Stores calculated hygiene scores
   - Partition Key: `scanId`
   - TTL: 90 days

4. **AlertHistory** - Stores sent alerts
   - Partition Key: `alertId`
   - GSI: `userId` + `timestamp`
   - TTL: 30 days

5. **AICache** - Caches AI API responses
   - Partition Key: `cacheKey`
   - TTL: 24 hours

### S3 Buckets

1. **Reports Bucket** - Stores generated PDF reports
   - Lifecycle: Delete after 30 days
   - Encryption: AES-256

2. **Diagrams Bucket** - Stores architecture diagrams
   - Lifecycle: Delete after 30 days
   - Encryption: AES-256

### Lambda Functions

1. **Scan Lambda** - Scans AWS resources across all regions
   - Timeout: 5 minutes
   - Memory: 1024 MB
   - Runtime: Node.js 18

2. **Score Lambda** - Calculates hygiene scores
   - Timeout: 1 minute
   - Memory: 512 MB
   - Runtime: Node.js 18

3. **AI Lambda** - Handles AI-powered features
   - Timeout: 30 seconds
   - Memory: 512 MB
   - Runtime: Node.js 18

4. **Report Lambda** - Generates PDF reports and diagrams
   - Timeout: 2 minutes
   - Memory: 1024 MB
   - Runtime: Node.js 18

5. **Scheduler Lambda** - Executes scheduled scans and alerts
   - Timeout: 5 minutes
   - Memory: 512 MB
   - Runtime: Node.js 18

### API Gateway Endpoints

- `POST /scan` - Initiate a new scan
- `GET /scan/latest` - Get latest scan for user
- `GET /scan/{scanId}` - Get specific scan result
- `GET /score/{scanId}` - Get hygiene score
- `POST /ai/cost-advisor` - Get cost recommendations
- `POST /ai/risk-summary` - Get security risk summary
- `POST /ai/iam-explainer` - Explain IAM policy
- `POST /ai/chat` - Chat with Cloud Copilot
- `POST /report/generate` - Generate PDF report
- `GET /schedule` - Get schedule configuration
- `PUT /schedule` - Update schedule configuration
- `GET /alerts` - Get alert history

All endpoints require Cognito JWT authentication.

## Environment Variables

Lambda functions use the following environment variables (automatically set by CDK):

- `SCAN_RESULTS_TABLE` - ScanResults table name
- `USERS_TABLE` - Users table name
- `HYGIENE_SCORES_TABLE` - HygieneScores table name
- `ALERT_HISTORY_TABLE` - AlertHistory table name
- `AI_CACHE_TABLE` - AICache table name
- `REPORTS_BUCKET` - Reports S3 bucket name
- `DIAGRAMS_BUCKET` - Diagrams S3 bucket name
- `SCAN_LAMBDA_ARN` - Scan Lambda function ARN

## Testing

The project uses Vitest for testing with both unit tests and property-based tests.

### Unit Tests

Unit tests verify specific examples and edge cases:

```typescript
// Example unit test
describe('calculateHygieneScore', () => {
  it('should return 100 for perfect scan', () => {
    const scan = createPerfectScan();
    const score = calculateHygieneScore(scan);
    expect(score).toBe(100);
  });
});
```

### Property-Based Tests

Property-based tests verify universal properties using `fast-check`:

```typescript
// Example property test
import fc from 'fast-check';

describe('Property 5: Hygiene Score Bounds', () => {
  it('should calculate scores between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({ /* ... */ }),
        (scanResult) => {
          const score = calculateHygieneScore(scanResult);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Security

- All Lambda functions use least privilege IAM roles
- Data encrypted at rest (DynamoDB, S3)
- Data encrypted in transit (TLS 1.2+)
- API Gateway protected by Cognito JWT authentication
- X-Ray tracing enabled for all functions
- CloudWatch logging for audit trails

## Monitoring

- CloudWatch Logs: All Lambda invocations
- CloudWatch Metrics: Custom metrics for scans, scores, AI calls
- CloudWatch Alarms: Error rates, latency thresholds
- X-Ray: Distributed tracing and performance analysis

## Cost Optimization

- Pay-per-request DynamoDB billing
- S3 lifecycle policies for automatic cleanup
- Lambda functions sized appropriately
- API Gateway throttling to prevent abuse
- AI response caching to reduce API costs

## Next Steps

1. Implement Scan Lambda (Task 2)
2. Implement Score Lambda (Task 3)
3. Implement AI Lambda (Task 5)
4. Implement Report Lambda (Task 6)
5. Implement Scheduler Lambda (Task 7)
6. Add comprehensive tests
7. Set up CI/CD pipeline

## License

MIT

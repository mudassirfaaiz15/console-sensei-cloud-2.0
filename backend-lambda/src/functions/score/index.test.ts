import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './index';
import { Context } from 'aws-lambda';
import * as dynamodb from '../../utils/dynamodb';
import * as scoreCalculator from '../../utils/score-calculator';
import * as scorePersistence from '../../utils/score-persistence';
import { ScanResult, ScoreResult } from '../../types';

// Mock the utility modules
vi.mock('../../utils/dynamodb');
vi.mock('../../utils/score-calculator');
vi.mock('../../utils/score-persistence');

describe('Score Lambda Handler', () => {
  const mockContext: Context = {
    awsRequestId: 'test-request-id',
    functionName: 'score-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:score-function',
    memoryLimitInMB: '512',
    logGroupName: '/aws/lambda/score-function',
    logStreamName: '2024/01/01/[$LATEST]test',
    callbackWaitsForEmptyEventLoop: true,
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if scanId is missing', async () => {
    const event = {
      body: JSON.stringify({}),
    } as any;

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_SCAN_ID');
  });

  it('should return 404 if scan result not found', async () => {
    vi.mocked(dynamodb.getScanResult).mockResolvedValue(null);

    const event = {
      body: JSON.stringify({ scanId: 'scan-123' }),
    } as any;

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('SCAN_NOT_FOUND');
  });

  it('should calculate and store hygiene score successfully', async () => {
    const mockScanResult: ScanResult = {
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
    };

    const mockScoreResult: ScoreResult = {
      scanId: 'scan-123',
      userId: 'user-456',
      timestamp: '2024-01-15T10:05:00Z',
      overallScore: 100,
      breakdown: {
        security: {
          score: 40,
          maxScore: 40,
          issues: [],
        },
        costEfficiency: {
          score: 30,
          maxScore: 30,
          issues: [],
        },
        bestPractices: {
          score: 30,
          maxScore: 30,
          issues: [],
        },
      },
    };

    vi.mocked(dynamodb.getScanResult).mockResolvedValue(mockScanResult);
    vi.mocked(scoreCalculator.calculateHygieneScore).mockReturnValue(mockScoreResult);
    vi.mocked(scorePersistence.storeHygieneScore).mockResolvedValue(undefined);

    const event = {
      body: JSON.stringify({ scanId: 'scan-123' }),
    } as any;

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockScoreResult);
    expect(dynamodb.getScanResult).toHaveBeenCalledWith('scan-123');
    expect(scoreCalculator.calculateHygieneScore).toHaveBeenCalledWith(mockScanResult);
    expect(scorePersistence.storeHygieneScore).toHaveBeenCalledWith(mockScoreResult);
  });

  it('should handle direct invocation event', async () => {
    const mockScanResult: ScanResult = {
      scanId: 'scan-789',
      userId: 'user-456',
      timestamp: '2024-01-15T10:00:00Z',
      resources: [],
      summary: {
        totalResources: 0,
        byType: {},
        byRegion: {},
      },
      errors: [],
    };

    const mockScoreResult: ScoreResult = {
      scanId: 'scan-789',
      userId: 'user-456',
      timestamp: '2024-01-15T10:05:00Z',
      overallScore: 100,
      breakdown: {
        security: {
          score: 40,
          maxScore: 40,
          issues: [],
        },
        costEfficiency: {
          score: 30,
          maxScore: 30,
          issues: [],
        },
        bestPractices: {
          score: 30,
          maxScore: 30,
          issues: [],
        },
      },
    };

    vi.mocked(dynamodb.getScanResult).mockResolvedValue(mockScanResult);
    vi.mocked(scoreCalculator.calculateHygieneScore).mockReturnValue(mockScoreResult);
    vi.mocked(scorePersistence.storeHygieneScore).mockResolvedValue(undefined);

    const event = {
      scanId: 'scan-789',
    } as any;

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.scanId).toBe('scan-789');
  });

  it('should return 500 on internal error', async () => {
    vi.mocked(dynamodb.getScanResult).mockRejectedValue(new Error('Database error'));

    const event = {
      body: JSON.stringify({ scanId: 'scan-123' }),
    } as any;

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

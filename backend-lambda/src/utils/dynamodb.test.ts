import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { ScanResult } from '../types';

// Create mock send function
const mockSend = vi.fn();

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: mockSend,
    })),
  },
  PutCommand: vi.fn((params) => params),
  GetCommand: vi.fn((params) => params),
  QueryCommand: vi.fn((params) => params),
}));

// Import after mocking
const { storeScanResult, getScanResult, getLatestScanForUser, getScanHistory } = await import('./dynamodb');

describe('DynamoDB Utilities', () => {
  const mockScanResult: ScanResult = {
    scanId: 'scan_20240115_abc123',
    userId: 'user_xyz',
    timestamp: '2024-01-15T10:30:00Z',
    resources: [
      {
        resourceId: 'i-1234567890abcdef0',
        resourceName: 'test-instance',
        resourceType: 'EC2_Instance',
        region: 'us-east-1',
        state: 'running',
        tags: { Name: 'test' },
        metadata: {},
      },
    ],
    summary: {
      totalResources: 1,
      byType: { EC2_Instance: 1 },
      byRegion: { 'us-east-1': 1 },
    },
    errors: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeScanResult', () => {
    it('should store scan result with TTL', async () => {
      mockSend.mockResolvedValue({});

      await storeScanResult(mockScanResult);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'ConsoleSensei-ScanResults',
          Item: expect.objectContaining({
            scanId: mockScanResult.scanId,
            userId: mockScanResult.userId,
            timestamp: mockScanResult.timestamp,
            ttl: expect.any(Number),
          }),
        })
      );
    });

    it('should calculate TTL as 90 days from now', async () => {
      mockSend.mockResolvedValue({});

      const beforeTime = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
      
      await storeScanResult(mockScanResult);

      const afterTime = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);

      const sendCall = mockSend.mock.calls[mockSend.mock.calls.length - 1][0];
      const ttl = sendCall.Item.ttl;

      expect(ttl).toBeGreaterThanOrEqual(beforeTime);
      expect(ttl).toBeLessThanOrEqual(afterTime);
    });

    it('should include all scan result fields', async () => {
      mockSend.mockResolvedValue({});

      await storeScanResult(mockScanResult);

      const sendCall = mockSend.mock.calls[mockSend.mock.calls.length - 1][0];
      const item = sendCall.Item;

      expect(item.scanId).toBe(mockScanResult.scanId);
      expect(item.userId).toBe(mockScanResult.userId);
      expect(item.timestamp).toBe(mockScanResult.timestamp);
      expect(item.resources).toEqual(mockScanResult.resources);
      expect(item.summary).toEqual(mockScanResult.summary);
      expect(item.errors).toEqual(mockScanResult.errors);
    });
  });

  describe('getScanResult', () => {
    it('should retrieve scan result by scanId', async () => {
      mockSend.mockResolvedValue({
        Item: mockScanResult,
      });

      const result = await getScanResult('scan_20240115_abc123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'ConsoleSensei-ScanResults',
          Key: { scanId: 'scan_20240115_abc123' },
        })
      );

      expect(result).toEqual(mockScanResult);
    });

    it('should return null if scan not found', async () => {
      mockSend.mockResolvedValue({
        Item: undefined,
      });

      const result = await getScanResult('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getLatestScanForUser', () => {
    it('should query by userId and return latest scan', async () => {
      mockSend.mockResolvedValue({
        Items: [mockScanResult],
      });

      const result = await getLatestScanForUser('user_xyz');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'ConsoleSensei-ScanResults',
          IndexName: 'UserIdTimestampIndex',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': 'user_xyz',
          },
          ScanIndexForward: false,
          Limit: 1,
        })
      );

      expect(result).toEqual(mockScanResult);
    });

    it('should return null if no scans found for user', async () => {
      mockSend.mockResolvedValue({
        Items: [],
      });

      const result = await getLatestScanForUser('user_xyz');

      expect(result).toBeNull();
    });
  });

  describe('getScanHistory', () => {
    it('should query by userId and date range', async () => {
      mockSend.mockResolvedValue({
        Items: [mockScanResult],
      });

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const result = await getScanHistory('user_xyz', startDate, endDate);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'ConsoleSensei-ScanResults',
          IndexName: 'UserIdTimestampIndex',
          KeyConditionExpression: 'userId = :userId AND #ts BETWEEN :startDate AND :endDate',
          ExpressionAttributeNames: {
            '#ts': 'timestamp',
          },
          ExpressionAttributeValues: {
            ':userId': 'user_xyz',
            ':startDate': startDate,
            ':endDate': endDate,
          },
          ScanIndexForward: false,
        })
      );

      expect(result).toEqual([mockScanResult]);
    });

    it('should return empty array if no scans in date range', async () => {
      mockSend.mockResolvedValue({
        Items: [],
      });

      const result = await getScanHistory('user_xyz', '2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z');

      expect(result).toEqual([]);
    });
  });

  describe('TTL retention', () => {
    it('should set TTL to exactly 90 days', async () => {
      mockSend.mockResolvedValue({});

      const now = Date.now();
      const expectedTTL = Math.floor(now / 1000) + (90 * 24 * 60 * 60);

      await storeScanResult(mockScanResult);

      const sendCall = mockSend.mock.calls[mockSend.mock.calls.length - 1][0];
      const ttl = sendCall.Item.ttl;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(ttl - expectedTTL)).toBeLessThanOrEqual(1);
    });
  });
});

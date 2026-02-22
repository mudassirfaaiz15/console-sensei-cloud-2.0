import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ScanResult } from '../types';

/**
 * DynamoDB utility for storing and retrieving scan results
 * 
 * Requirements:
 * - 3.9: Store scan results in DynamoDB with timestamp and user ID
 * - 19.1: Store all scan results with timestamps
 * - 19.2: Retain scan history for 90 days
 */

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCAN_RESULTS_TABLE = process.env.SCAN_RESULTS_TABLE || 'ConsoleSensei-ScanResults';
const TTL_DAYS = 90;

/**
 * Store scan result in DynamoDB with 90-day TTL
 * 
 * @param scanResult - The scan result to store
 * @returns Promise that resolves when the item is stored
 */
export async function storeScanResult(scanResult: ScanResult): Promise<void> {
  // Calculate TTL (90 days from now)
  const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

  const item = {
    ...scanResult,
    ttl,
  };

  const command = new PutCommand({
    TableName: SCAN_RESULTS_TABLE,
    Item: item,
  });

  await docClient.send(command);

  console.log('Scan result stored in DynamoDB', {
    scanId: scanResult.scanId,
    userId: scanResult.userId,
    timestamp: scanResult.timestamp,
    ttl,
    resourceCount: scanResult.resources.length,
  });
}

/**
 * Retrieve scan result by scanId
 * 
 * @param scanId - The scan ID to retrieve
 * @returns The scan result or null if not found
 */
export async function getScanResult(scanId: string): Promise<ScanResult | null> {
  const command = new GetCommand({
    TableName: SCAN_RESULTS_TABLE,
    Key: { scanId },
  });

  const response = await docClient.send(command);

  if (!response.Item) {
    return null;
  }

  return response.Item as ScanResult;
}

/**
 * Get latest scan for a user
 * 
 * @param userId - The user ID
 * @returns The latest scan result or null if no scans found
 */
export async function getLatestScanForUser(userId: string): Promise<ScanResult | null> {
  const command = new QueryCommand({
    TableName: SCAN_RESULTS_TABLE,
    IndexName: 'UserIdTimestampIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Sort descending (newest first)
    Limit: 1,
  });

  const response = await docClient.send(command);

  if (!response.Items || response.Items.length === 0) {
    return null;
  }

  return response.Items[0] as ScanResult;
}

/**
 * Get scan history for a user within a date range
 * 
 * @param userId - The user ID
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of scan results
 */
export async function getScanHistory(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ScanResult[]> {
  const command = new QueryCommand({
    TableName: SCAN_RESULTS_TABLE,
    IndexName: 'UserIdTimestampIndex',
    KeyConditionExpression: 'userId = :userId AND #ts BETWEEN :startDate AND :endDate',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':startDate': startDate,
      ':endDate': endDate,
    },
    ScanIndexForward: false, // Sort descending (newest first)
  });

  const response = await docClient.send(command);

  return (response.Items || []) as ScanResult[];
}

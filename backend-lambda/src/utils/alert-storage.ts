import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Alert } from '../types';

/**
 * DynamoDB utility for storing and retrieving alerts
 * 
 * Requirements:
 * - 10.12: Store alert history in DynamoDB with deduplication
 * - 10.12: Implement alert deduplication to prevent notification spam
 */

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ALERT_HISTORY_TABLE = process.env.ALERT_HISTORY_TABLE || 'ConsoleSensei-AlertHistory';
const TTL_DAYS = 30;

/**
 * Store alert in DynamoDB with 30-day TTL
 * 
 * @param alert - The alert to store
 * @returns Promise that resolves when the alert is stored
 */
export async function storeAlert(alert: Alert): Promise<void> {
  // Calculate TTL (30 days from now)
  const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

  const item = {
    ...alert,
    ttl,
  };

  const command = new PutCommand({
    TableName: ALERT_HISTORY_TABLE,
    Item: item,
  });

  await docClient.send(command);

  console.log('Alert stored in DynamoDB', {
    alertId: alert.alertId,
    userId: alert.userId,
    alertType: alert.alertType,
    deduplicationKey: alert.deduplicationKey,
  });
}

/**
 * Check if an alert with the same deduplication key was sent recently (within 24 hours)
 * 
 * @param userId - The user ID
 * @param deduplicationKey - The deduplication key
 * @returns true if a duplicate alert was found within 24 hours, false otherwise
 */
export async function isDuplicateAlert(
  userId: string,
  deduplicationKey: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const command = new QueryCommand({
    TableName: ALERT_HISTORY_TABLE,
    IndexName: 'UserIdTimestampIndex',
    KeyConditionExpression: 'userId = :userId AND #ts > :twentyFourHoursAgo',
    FilterExpression: 'deduplicationKey = :deduplicationKey',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':twentyFourHoursAgo': twentyFourHoursAgo,
      ':deduplicationKey': deduplicationKey,
    },
    Limit: 1,
  });

  const response = await docClient.send(command);

  return (response.Items && response.Items.length > 0) || false;
}

/**
 * Get alert history for a user
 * 
 * @param userId - The user ID
 * @param limit - Maximum number of alerts to return (default 100)
 * @returns Array of alerts
 */
export async function getAlertHistory(userId: string, limit: number = 100): Promise<Alert[]> {
  const command = new QueryCommand({
    TableName: ALERT_HISTORY_TABLE,
    IndexName: 'UserIdTimestampIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Sort descending (newest first)
    Limit: limit,
  });

  const response = await docClient.send(command);

  return (response.Items || []) as Alert[];
}

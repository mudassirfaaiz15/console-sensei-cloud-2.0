import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ScoreResult } from '../types';

/**
 * DynamoDB utility for storing and retrieving hygiene scores
 * 
 * Requirements:
 * - 4.1: Calculate hygiene score and store in DynamoDB
 * - 4.18: Provide detailed breakdown of score components
 */

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const HYGIENE_SCORES_TABLE = process.env.HYGIENE_SCORES_TABLE || 'ConsoleSensei-HygieneScores';
const TTL_DAYS = 90;

/**
 * Store hygiene score in DynamoDB with 90-day TTL
 * 
 * @param scoreResult - The score result to store
 * @returns Promise that resolves when the item is stored
 */
export async function storeHygieneScore(scoreResult: ScoreResult): Promise<void> {
  // Calculate TTL (90 days from now)
  const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

  const item = {
    ...scoreResult,
    ttl,
  };

  const command = new PutCommand({
    TableName: HYGIENE_SCORES_TABLE,
    Item: item,
  });

  await docClient.send(command);

  console.log('Hygiene score stored in DynamoDB', {
    scanId: scoreResult.scanId,
    userId: scoreResult.userId,
    timestamp: scoreResult.timestamp,
    overallScore: scoreResult.overallScore,
    ttl,
  });
}

/**
 * Retrieve hygiene score by scanId
 * 
 * @param scanId - The scan ID to retrieve
 * @returns The score result or null if not found
 */
export async function getHygieneScore(scanId: string): Promise<ScoreResult | null> {
  const command = new GetCommand({
    TableName: HYGIENE_SCORES_TABLE,
    Key: { scanId },
  });

  const response = await docClient.send(command);

  if (!response.Item) {
    return null;
  }

  return response.Item as ScoreResult;
}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { AICache } from '../types';

/**
 * AI Cache utility for storing and retrieving AI recommendations
 * 
 * Requirements:
 * - 6.10: Cache AI recommendations for 24 hours
 */

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const AI_CACHE_TABLE = process.env.AI_CACHE_TABLE || 'ConsoleSensei-AICache';
const CACHE_TTL_HOURS = 24;

/**
 * Get cached AI response
 * 
 * @param cacheKey - The cache key
 * @param userId - The user ID
 * @returns Cached response or null if not found or expired
 */
export async function getAICache(cacheKey: string, userId: string): Promise<any | null> {
  try {
    const command = new GetCommand({
      TableName: AI_CACHE_TABLE,
      Key: { cacheKey },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return null;
    }

    const cache = response.Item as AICache;

    // Check if cache is expired
    const now = Math.floor(Date.now() / 1000);
    if (cache.ttl < now) {
      console.log('Cache expired', { cacheKey });
      return null;
    }

    // Verify user owns this cache entry
    if (cache.userId !== userId) {
      console.warn('Unauthorized cache access attempt', { cacheKey, userId });
      return null;
    }

    console.log('Cache hit', { cacheKey });
    return cache.response;
  } catch (error) {
    console.error('Error retrieving AI cache:', error);
    return null;
  }
}

/**
 * Set AI cache response
 * 
 * @param cacheKey - The cache key
 * @param userId - The user ID
 * @param response - The response to cache
 */
export async function setAICache(cacheKey: string, userId: string, response: any): Promise<void> {
  try {
    // Calculate TTL (24 hours from now)
    const ttl = Math.floor(Date.now() / 1000) + (CACHE_TTL_HOURS * 60 * 60);

    const item: AICache = {
      cacheKey,
      userId,
      response,
      createdAt: new Date().toISOString(),
      ttl,
    };

    const command = new PutCommand({
      TableName: AI_CACHE_TABLE,
      Item: item,
    });

    await docClient.send(command);

    console.log('AI response cached', { cacheKey, ttl });
  } catch (error) {
    console.error('Error setting AI cache:', error);
    // Don't throw - caching failure shouldn't break the request
  }
}

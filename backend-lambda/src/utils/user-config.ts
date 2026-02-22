import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { User, AlertConfig, ScheduleConfig } from '../types';

/**
 * User configuration utility for managing user preferences and alert settings
 * 
 * Requirements:
 * - 10.2: Support daily, weekly, and custom cron schedule configurations
 * - 10.9: Allow users to configure alert thresholds and notification preferences
 * - 10.10: Store alert configurations in DynamoDB per user
 */

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || 'ConsoleSensei-Users';

/**
 * Get user configuration
 * 
 * @param userId - The user ID
 * @returns User configuration or null if not found
 */
export async function getUserConfig(userId: string): Promise<User | null> {
  const command = new GetCommand({
    TableName: USERS_TABLE,
    Key: { userId },
  });

  const response = await docClient.send(command);

  if (!response.Item) {
    return null;
  }

  return response.Item as User;
}

/**
 * Update user alert configuration
 * 
 * @param userId - The user ID
 * @param alertConfig - The alert configuration to update
 * @returns Promise that resolves when the configuration is updated
 */
export async function updateAlertConfig(
  userId: string,
  alertConfig: AlertConfig
): Promise<void> {
  const user = await getUserConfig(userId);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  user.alertConfig = alertConfig;
  user.updatedAt = new Date().toISOString();

  const command = new PutCommand({
    TableName: USERS_TABLE,
    Item: user,
  });

  await docClient.send(command);

  console.log('Alert configuration updated', {
    userId,
    emailEnabled: alertConfig.email.enabled,
    slackEnabled: alertConfig.slack.enabled,
  });
}

/**
 * Update user schedule configuration
 * 
 * @param userId - The user ID
 * @param scheduleConfig - The schedule configuration to update
 * @returns Promise that resolves when the configuration is updated
 */
export async function updateScheduleConfig(
  userId: string,
  scheduleConfig: ScheduleConfig
): Promise<void> {
  const user = await getUserConfig(userId);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  user.scheduleConfig = scheduleConfig;
  user.updatedAt = new Date().toISOString();

  const command = new PutCommand({
    TableName: USERS_TABLE,
    Item: user,
  });

  await docClient.send(command);

  console.log('Schedule configuration updated', {
    userId,
    enabled: scheduleConfig.enabled,
    frequency: scheduleConfig.frequency,
  });
}

/**
 * Get user's alert configuration
 * 
 * @param userId - The user ID
 * @returns Alert configuration or default if not configured
 */
export async function getAlertConfig(userId: string): Promise<AlertConfig> {
  const user = await getUserConfig(userId);

  if (!user || !user.alertConfig) {
    // Return default configuration
    return {
      email: {
        enabled: false,
        address: '',
      },
      slack: {
        enabled: false,
        webhookUrl: '',
      },
      thresholds: {
        hygieneScoreDrop: 10,
        costIncreasePercent: 20,
      },
    };
  }

  return user.alertConfig;
}

/**
 * Get user's schedule configuration
 * 
 * @param userId - The user ID
 * @returns Schedule configuration or default if not configured
 */
export async function getScheduleConfig(userId: string): Promise<ScheduleConfig> {
  const user = await getUserConfig(userId);

  if (!user || !user.scheduleConfig) {
    // Return default configuration (disabled)
    return {
      enabled: false,
      frequency: 'daily',
      timezone: 'UTC',
    };
  }

  return user.scheduleConfig;
}

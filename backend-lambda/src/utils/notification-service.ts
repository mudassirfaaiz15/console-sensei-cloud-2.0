import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Alert, AlertConfig } from '../types';
import https from 'https';

/**
 * Notification service for sending alerts via email and Slack
 * 
 * Requirements:
 * - 10.7: Implement email notifications via SES
 * - 10.8: Implement Slack notifications
 * - 10.11: Include a summary of changes in alert notifications
 */

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@consolesensei.com';

/**
 * Send email notification via AWS SES
 * 
 * @param toEmail - Recipient email address
 * @param alert - The alert to send
 * @returns Promise that resolves when email is sent
 */
export async function sendEmailNotification(toEmail: string, alert: Alert): Promise<void> {
  const subject = formatEmailSubject(alert);
  const htmlBody = formatEmailBody(alert);

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log('Email notification sent', {
      toEmail,
      alertType: alert.alertType,
      alertId: alert.alertId,
    });
  } catch (error) {
    console.error('Failed to send email notification', {
      toEmail,
      alertType: alert.alertType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Send Slack notification via webhook
 * 
 * @param webhookUrl - Slack webhook URL
 * @param alert - The alert to send
 * @returns Promise that resolves when message is sent
 */
export async function sendSlackNotification(webhookUrl: string, alert: Alert): Promise<void> {
  const payload = formatSlackMessage(alert);

  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Slack notification sent', {
            alertType: alert.alertType,
            alertId: alert.alertId,
          });
          resolve();
        } else {
          reject(new Error(`Slack API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Failed to send Slack notification', {
        alertType: alert.alertType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Send alert via configured channels
 * 
 * @param alert - The alert to send
 * @param alertConfig - User's alert configuration
 * @returns Promise that resolves when all notifications are sent
 */
export async function sendAlert(alert: Alert, alertConfig: AlertConfig): Promise<void> {
  const promises: Promise<void>[] = [];

  if (alertConfig.email.enabled && alertConfig.email.address) {
    promises.push(sendEmailNotification(alertConfig.email.address, alert));
  }

  if (alertConfig.slack.enabled && alertConfig.slack.webhookUrl) {
    promises.push(sendSlackNotification(alertConfig.slack.webhookUrl, alert));
  }

  if (promises.length === 0) {
    console.warn('No notification channels enabled for alert', {
      alertId: alert.alertId,
      userId: alert.userId,
    });
    return;
  }

  await Promise.all(promises);
}

/**
 * Format email subject based on alert type
 */
function formatEmailSubject(alert: Alert): string {
  const severityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️',
  };

  const emoji = severityEmoji[alert.severity];

  switch (alert.alertType) {
    case 'new_security_issues':
      return `${emoji} New Security Issues Detected - ConsoleSensei Alert`;
    case 'hygiene_score_drop':
      return `${emoji} Hygiene Score Drop - ConsoleSensei Alert`;
    case 'cost_increase':
      return `${emoji} Cost Increase Detected - ConsoleSensei Alert`;
    default:
      return `${emoji} ConsoleSensei Alert`;
  }
}

/**
 * Format email body with alert details
 */
function formatEmailBody(alert: Alert): string {
  const details = alert.details as any;
  const changeSummary = details.changeSummary || '';

  let issuesHtml = '';
  if (details.newIssues && Array.isArray(details.newIssues)) {
    issuesHtml = `
      <h3>New Issues Detected:</h3>
      <ul>
        ${details.newIssues.map((issue: any) => `<li>${issue.description}</li>`).join('')}
      </ul>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .message { margin: 20px 0; }
          .details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${alert.message}</h2>
            <p>Severity: <strong>${alert.severity.toUpperCase()}</strong></p>
          </div>
          
          <div class="message">
            <p>${changeSummary}</p>
          </div>
          
          ${issuesHtml}
          
          <div class="details">
            <p><strong>Alert ID:</strong> ${alert.alertId}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated alert from ConsoleSensei. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format Slack message payload
 */
function formatSlackMessage(alert: Alert): Record<string, any> {
  const details = alert.details as any;
  const changeSummary = details.changeSummary || '';

  const colorMap = {
    critical: '#d32f2f',
    high: '#f57c00',
    medium: '#fbc02d',
    low: '#388e3c',
  };

  const fields: Record<string, any>[] = [
    {
      title: 'Severity',
      value: alert.severity.toUpperCase(),
      short: true,
    },
    {
      title: 'Alert Type',
      value: alert.alertType.replace(/_/g, ' '),
      short: true,
    },
  ];

  if (details.scoreChange !== undefined) {
    fields.push({
      title: 'Score Change',
      value: `${details.scoreChange > 0 ? '+' : ''}${details.scoreChange}`,
      short: true,
    });
  }

  if (details.costChange !== undefined) {
    fields.push({
      title: 'Cost Change',
      value: `${details.costChange > 0 ? '+' : ''}${details.costChange}%`,
      short: true,
    });
  }

  return {
    attachments: [
      {
        color: colorMap[alert.severity],
        title: alert.message,
        text: changeSummary,
        fields,
        footer: 'ConsoleSensei',
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
      },
    ],
  };
}

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ScoreEvent, ApiResponse, ScoreResult } from '../../types';
import { getScanResult } from '../../utils/dynamodb';
import { calculateHygieneScore } from '../../utils/score-calculator';
import { storeHygieneScore } from '../../utils/score-persistence';

/**
 * Score Lambda Handler
 * 
 * Calculates hygiene score from scan results
 * 
 * Requirements:
 * - 4.1: Calculate hygiene score from 0 to 100
 * - 4.18: Provide detailed breakdown of score components
 * 
 * @param event - API Gateway event or direct invocation event
 * @param context - Lambda context
 * @returns API Gateway response
 */
export const handler = async (
  event: APIGatewayProxyEvent | ScoreEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Score Lambda invoked', { event, context });

  try {
    // Parse event to get scanId
    let scanId: string;

    if ('body' in event && event.body) {
      // API Gateway event
      const body = JSON.parse(event.body);
      scanId = body.scanId;
    } else {
      // Direct invocation
      scanId = (event as ScoreEvent).scanId;
    }

    if (!scanId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_SCAN_ID',
          message: 'scanId is required',
          timestamp: new Date().toISOString(),
          requestId: context.awsRequestId,
        },
      };

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response),
      };
    }

    console.log('Retrieving scan result', { scanId });

    // Retrieve scan result from DynamoDB
    const scanResult = await getScanResult(scanId);

    if (!scanResult) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SCAN_NOT_FOUND',
          message: `Scan result not found for scanId: ${scanId}`,
          timestamp: new Date().toISOString(),
          requestId: context.awsRequestId,
        },
      };

      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response),
      };
    }

    console.log('Scan result retrieved', {
      scanId: scanResult.scanId,
      userId: scanResult.userId,
      resourceCount: scanResult.resources.length,
    });

    // Calculate hygiene score
    const scoreResult = calculateHygieneScore(scanResult);

    // Store score in DynamoDB
    await storeHygieneScore(scoreResult);

    console.log('Score calculation complete', {
      scanId: scoreResult.scanId,
      overallScore: scoreResult.overallScore,
    });

    const response: ApiResponse<ScoreResult> = {
      success: true,
      data: scoreResult,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in Score Lambda:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      },
    };

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  }
};

import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../types';

/**
 * Utility functions for creating API Gateway responses
 */

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function successResponse<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(response),
  };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: string,
  requestId?: string
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(response),
  };
}

export function notFoundResponse(message: string = 'Resource not found', requestId?: string): APIGatewayProxyResult {
  return errorResponse('NOT_FOUND', message, 404, undefined, requestId);
}

export function badRequestResponse(message: string, details?: string, requestId?: string): APIGatewayProxyResult {
  return errorResponse('BAD_REQUEST', message, 400, details, requestId);
}

export function unauthorizedResponse(message: string = 'Unauthorized', requestId?: string): APIGatewayProxyResult {
  return errorResponse('UNAUTHORIZED', message, 401, undefined, requestId);
}

export function forbiddenResponse(message: string = 'Forbidden', requestId?: string): APIGatewayProxyResult {
  return errorResponse('FORBIDDEN', message, 403, undefined, requestId);
}

export function internalErrorResponse(error: Error, requestId?: string): APIGatewayProxyResult {
  return errorResponse(
    'INTERNAL_ERROR',
    'Internal server error',
    500,
    error.message,
    requestId
  );
}

export function notImplementedResponse(message: string = 'Not implemented yet', requestId?: string): APIGatewayProxyResult {
  return errorResponse('NOT_IMPLEMENTED', message, 501, undefined, requestId);
}

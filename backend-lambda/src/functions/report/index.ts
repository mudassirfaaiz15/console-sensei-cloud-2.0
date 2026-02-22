import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ReportEvent, ApiResponse, AIRecommendation } from '../../types';
import { createAWSClients } from '../../utils/aws-clients';
import { getScanResult } from '../../utils/dynamodb';
import { getHygieneScore } from '../../utils/score-persistence';
import { generatePDFReport } from '../../utils/pdf-generator';
import { generateArchitectureDiagram, generateSVGDiagram } from '../../utils/diagram-generator';
import { uploadPDFReport, uploadDiagram } from '../../utils/s3-report-storage';

/**
 * Report Lambda Handler
 * 
 * Generates PDF reports and architecture diagrams
 * 
 * Requirements:
 * - 12.1: Generate PDF with scan results
 * - 12.2-12.6: Include all required sections in PDF
 * - 12.7-12.8: Store in S3 with signed URLs (24-hour expiration)
 * - 13.1-13.7: Generate architecture diagrams
 * 
 * @param event - API Gateway event or direct invocation event
 * @param context - Lambda context
 * @returns API Gateway response
 */
export const handler = async (
  event: APIGatewayProxyEvent | ReportEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Report Lambda invoked', { event });

  try {
    // Parse event
    let reportEvent: ReportEvent;
    
    if ('httpMethod' in event) {
      // API Gateway event
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      reportEvent = body as ReportEvent;
    } else {
      // Direct invocation
      reportEvent = event as ReportEvent;
    }

    const { scanId, reportType, userId } = reportEvent;

    if (!scanId || !reportType || !userId) {
      return createErrorResponse(400, 'INVALID_REQUEST', 'Missing required parameters: scanId, reportType, userId', context.awsRequestId);
    }

    if (!['pdf', 'diagram'].includes(reportType)) {
      return createErrorResponse(400, 'INVALID_REPORT_TYPE', 'reportType must be "pdf" or "diagram"', context.awsRequestId);
    }

    console.log('Generating report', { scanId, reportType, userId });

    // Retrieve scan and score data
    const [scanResult, scoreResult] = await Promise.all([
      getScanResult(scanId),
      getHygieneScore(scanId),
    ]);

    if (!scanResult) {
      return createErrorResponse(404, 'SCAN_NOT_FOUND', `Scan ${scanId} not found`, context.awsRequestId);
    }

    if (!scoreResult) {
      return createErrorResponse(404, 'SCORE_NOT_FOUND', `Score for scan ${scanId} not found`, context.awsRequestId);
    }

    // Verify user owns the scan
    if (scanResult.userId !== userId) {
      return createErrorResponse(403, 'UNAUTHORIZED', 'User does not own this scan', context.awsRequestId);
    }

    const s3Client = createAWSClients().s3;
    let reportUrl: string;
    let expiresAt: string;

    if (reportType === 'pdf') {
      // Generate PDF report
      console.log('Generating PDF report');

      // For now, use empty recommendations array
      // In production, this would fetch AI recommendations from cache or generate them
      const recommendations: AIRecommendation[] = [];

      const pdfBuffer = await generatePDFReport(scanResult, scoreResult, recommendations);

      // Upload to S3
      const uploadResult = await uploadPDFReport(s3Client, userId, scanId, pdfBuffer);
      reportUrl = uploadResult.signedUrl;
      expiresAt = uploadResult.expiresAt;

      console.log('PDF report generated and uploaded', { scanId, reportUrl });
    } else {
      // Generate architecture diagram
      console.log('Generating architecture diagram');

      const svgDiagram = generateSVGDiagram(scanResult);
      const diagramBuffer = Buffer.from(svgDiagram, 'utf-8');

      // Upload to S3
      const uploadResult = await uploadDiagram(s3Client, userId, scanId, diagramBuffer, 'svg');
      reportUrl = uploadResult.signedUrl;
      expiresAt = uploadResult.expiresAt;

      console.log('Architecture diagram generated and uploaded', { scanId, reportUrl });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        reportUrl,
        expiresAt,
        reportType,
        scanId,
      },
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
    console.error('Error in Report Lambda:', error);

    return createErrorResponse(
      500,
      'INTERNAL_ERROR',
      'Internal server error',
      context.awsRequestId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: string
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
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  };
}

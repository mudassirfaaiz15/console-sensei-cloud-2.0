import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3 Report Storage Utility
 * 
 * Handles:
 * - Uploading PDF reports and diagrams to S3
 * - Generating signed URLs with 24-hour expiration
 * - Managing S3 bucket operations
 * 
 * Requirements:
 * - 12.7: Store generated PDFs in S3 with signed URLs for download
 * - 12.8: Expire PDF download URLs after 24 hours
 * - 13.7: Store generated diagrams in S3
 */

const REPORTS_BUCKET = process.env.REPORTS_BUCKET || 'reports-bucket';
const DIAGRAMS_BUCKET = process.env.DIAGRAMS_BUCKET || 'diagrams-bucket';
const SIGNED_URL_EXPIRATION = 24 * 60 * 60; // 24 hours in seconds

/**
 * Upload PDF report to S3 and generate signed URL
 * 
 * @param s3Client - S3 client instance
 * @param userId - User ID for organizing reports
 * @param scanId - Scan ID for organizing reports
 * @param pdfBuffer - PDF file buffer
 * @returns Object with S3 key and signed URL
 */
export async function uploadPDFReport(
  s3Client: S3Client,
  userId: string,
  scanId: string,
  pdfBuffer: Buffer
): Promise<{ key: string; signedUrl: string; expiresAt: string }> {
  const key = `${userId}/${scanId}/report.pdf`;

  console.log('Uploading PDF report to S3', { bucket: REPORTS_BUCKET, key });

  try {
    const command = new PutObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        'scan-id': scanId,
        'user-id': userId,
        'generated-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    console.log('PDF report uploaded successfully', { key });

    // Generate signed URL
    const signedUrl = await generateSignedUrl(s3Client, REPORTS_BUCKET, key);
    const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRATION * 1000).toISOString();

    return { key, signedUrl, expiresAt };
  } catch (error) {
    console.error('Failed to upload PDF report', { key, error });
    throw new Error(`Failed to upload PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload architecture diagram to S3 and generate signed URL
 * 
 * @param s3Client - S3 client instance
 * @param userId - User ID for organizing diagrams
 * @param scanId - Scan ID for organizing diagrams
 * @param diagramBuffer - Diagram file buffer (SVG or PNG)
 * @param format - File format (svg or png)
 * @returns Object with S3 key and signed URL
 */
export async function uploadDiagram(
  s3Client: S3Client,
  userId: string,
  scanId: string,
  diagramBuffer: Buffer,
  format: 'svg' | 'png' = 'svg'
): Promise<{ key: string; signedUrl: string; expiresAt: string }> {
  const key = `${userId}/${scanId}/architecture.${format}`;
  const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png';

  console.log('Uploading diagram to S3', { bucket: DIAGRAMS_BUCKET, key, format });

  try {
    const command = new PutObjectCommand({
      Bucket: DIAGRAMS_BUCKET,
      Key: key,
      Body: diagramBuffer,
      ContentType: contentType,
      Metadata: {
        'scan-id': scanId,
        'user-id': userId,
        'format': format,
        'generated-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    console.log('Diagram uploaded successfully', { key });

    // Generate signed URL
    const signedUrl = await generateSignedUrl(s3Client, DIAGRAMS_BUCKET, key);
    const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRATION * 1000).toISOString();

    return { key, signedUrl, expiresAt };
  } catch (error) {
    console.error('Failed to upload diagram', { key, error });
    throw new Error(`Failed to upload diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for S3 object download
 * 
 * @param s3Client - S3 client instance
 * @param bucket - S3 bucket name
 * @param key - S3 object key
 * @returns Signed URL valid for 24 hours
 */
async function generateSignedUrl(s3Client: S3Client, bucket: string, key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_EXPIRATION,
    });

    console.log('Generated signed URL', { bucket, key, expiresIn: SIGNED_URL_EXPIRATION });

    return signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL', { bucket, key, error });
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Store report metadata in S3
 * 
 * @param s3Client - S3 client instance
 * @param userId - User ID
 * @param scanId - Scan ID
 * @param metadata - Report metadata
 */
export async function storeReportMetadata(
  s3Client: S3Client,
  userId: string,
  scanId: string,
  metadata: Record<string, any>
): Promise<void> {
  const key = `${userId}/${scanId}/metadata.json`;

  try {
    const command = new PutObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: key,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);

    console.log('Report metadata stored', { key });
  } catch (error) {
    console.error('Failed to store report metadata', { key, error });
    // Don't throw - metadata storage is optional
  }
}

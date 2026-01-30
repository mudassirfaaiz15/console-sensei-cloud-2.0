// AWS S3 Service
// Fetches S3 buckets information

import {
    ListBucketsCommand,
    GetBucketLocationCommand,
    type Bucket,
} from '@aws-sdk/client-s3';
import { createS3Client } from './client';
import { hasCredentials } from './credentials';

export interface S3Bucket {
    name: string;
    creationDate: string;
    region: string;
}

export interface S3Summary {
    buckets: S3Bucket[];
    totalBuckets: number;
}

/**
 * Fetch all S3 buckets
 */
export async function getS3Summary(): Promise<S3Summary> {
    if (!hasCredentials()) {
        throw new Error('AWS credentials not configured');
    }

    const client = createS3Client('us-east-1'); // ListBuckets works globally

    const response = await client.send(new ListBucketsCommand({}));

    const buckets: S3Bucket[] = [];

    for (const bucket of response.Buckets || []) {
        let region = 'us-east-1';

        try {
            const locationClient = createS3Client('us-east-1');
            const locationResponse = await locationClient.send(
                new GetBucketLocationCommand({ Bucket: bucket.Name })
            );
            region = locationResponse.LocationConstraint || 'us-east-1';
        } catch {
            // Default to us-east-1 if we can't get location
        }

        buckets.push({
            name: bucket.Name || '',
            creationDate: bucket.CreationDate?.toISOString() || '',
            region,
        });
    }

    return {
        buckets,
        totalBuckets: buckets.length,
    };
}

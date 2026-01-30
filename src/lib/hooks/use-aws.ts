// React Query hooks for AWS data
// Provides hooks for fetching real AWS data with caching and loading states

import { useQuery } from '@tanstack/react-query';
import { hasCredentials } from '@/lib/aws/credentials';
import { getCostSummary, getMonthlyCosts, getServiceCosts } from '@/lib/aws/cost-service';
import { getEC2Summary, getQuickEC2Summary } from '@/lib/aws/ec2-service';
import { getS3Summary } from '@/lib/aws/s3-service';
import { getIAMSummary } from '@/lib/aws/iam-service';

/**
 * Check if AWS is connected
 */
export function useAWSConnection() {
    return {
        isConnected: hasCredentials(),
    };
}

/**
 * Fetch AWS cost summary
 */
export function useAWSCosts() {
    return useQuery({
        queryKey: ['aws', 'costs'],
        queryFn: getCostSummary,
        enabled: hasCredentials(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
}

/**
 * Fetch monthly costs
 */
export function useAWSMonthlyCosts(months: number = 6) {
    return useQuery({
        queryKey: ['aws', 'costs', 'monthly', months],
        queryFn: () => getMonthlyCosts(months),
        enabled: hasCredentials(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

/**
 * Fetch service costs
 */
export function useAWSServiceCosts() {
    return useQuery({
        queryKey: ['aws', 'costs', 'services'],
        queryFn: getServiceCosts,
        enabled: hasCredentials(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

/**
 * Fetch EC2 resources summary
 */
export function useAWSEC2(quickScan: boolean = true) {
    return useQuery({
        queryKey: ['aws', 'ec2', quickScan ? 'quick' : 'full'],
        queryFn: () => (quickScan ? getQuickEC2Summary() : getEC2Summary()),
        enabled: hasCredentials(),
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 1,
    });
}

/**
 * Fetch S3 summary
 */
export function useAWSS3() {
    return useQuery({
        queryKey: ['aws', 's3'],
        queryFn: getS3Summary,
        enabled: hasCredentials(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

/**
 * Fetch IAM summary with security analysis
 */
export function useAWSIAM() {
    return useQuery({
        queryKey: ['aws', 'iam'],
        queryFn: getIAMSummary,
        enabled: hasCredentials(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });
}

/**
 * Fetch all AWS data for dashboard overview
 */
export function useAWSDashboard() {
    const costs = useAWSCosts();
    const ec2 = useAWSEC2(true);
    const s3 = useAWSS3();
    const iam = useAWSIAM();

    const isLoading = costs.isLoading || ec2.isLoading || s3.isLoading || iam.isLoading;
    const isError = costs.isError || ec2.isError || s3.isError || iam.isError;
    const hasData = costs.data || ec2.data || s3.data || iam.data;

    return {
        costs: costs.data,
        ec2: ec2.data,
        s3: s3.data,
        iam: iam.data,
        isLoading,
        isError,
        hasData,
        isConnected: hasCredentials(),
        refetch: () => {
            costs.refetch();
            ec2.refetch();
            s3.refetch();
            iam.refetch();
        },
    };
}

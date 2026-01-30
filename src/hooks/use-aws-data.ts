import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { awsService } from '@/services/aws-service';

// Query keys
export const awsKeys = {
    all: ['aws'] as const,
    resources: () => [...awsKeys.all, 'resources'] as const,
    resourcesByType: (type: string) => [...awsKeys.resources(), type] as const,
    alerts: () => [...awsKeys.all, 'alerts'] as const,
    activities: (limit?: number) => [...awsKeys.all, 'activities', limit] as const,
    costs: (months?: number) => [...awsKeys.all, 'costs', months] as const,
    currentCost: () => [...awsKeys.all, 'currentCost'] as const,
    hygieneScore: () => [...awsKeys.all, 'hygieneScore'] as const,
};

/**
 * Hook to fetch all AWS resources
 */
export function useResources() {
    return useQuery({
        queryKey: awsKeys.resources(),
        queryFn: awsService.getResources,
    });
}

/**
 * Hook to fetch resources by type
 */
export function useResourcesByType(type: string) {
    return useQuery({
        queryKey: awsKeys.resourcesByType(type),
        queryFn: () => awsService.getResourcesByType(type),
        enabled: !!type,
    });
}

/**
 * Hook to fetch alerts
 */
export function useAlerts() {
    return useQuery({
        queryKey: awsKeys.alerts(),
        queryFn: awsService.getAlerts,
    });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: awsService.dismissAlert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: awsKeys.alerts() });
        },
    });
}

/**
 * Hook to fetch activities
 */
export function useActivities(limit = 10) {
    return useQuery({
        queryKey: awsKeys.activities(limit),
        queryFn: () => awsService.getActivities(limit),
    });
}

/**
 * Hook to fetch cost data
 */
export function useCostData(months = 6) {
    return useQuery({
        queryKey: awsKeys.costs(months),
        queryFn: () => awsService.getCostData(months),
    });
}

/**
 * Hook to fetch current month cost
 */
export function useCurrentMonthCost() {
    return useQuery({
        queryKey: awsKeys.currentCost(),
        queryFn: awsService.getCurrentMonthCost,
    });
}

/**
 * Hook to fetch hygiene score
 */
export function useHygieneScore() {
    return useQuery({
        queryKey: awsKeys.hygieneScore(),
        queryFn: awsService.getHygieneScore,
    });
}

/**
 * Hook to run a scan
 */
export function useRunScan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: awsService.runScan,
        onSuccess: () => {
            // Invalidate all AWS queries after scan
            queryClient.invalidateQueries({ queryKey: awsKeys.all });
        },
    });
}

/**
 * Hook to connect AWS account
 */
export function useConnectAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ accessKeyId, secretAccessKey, region }: {
            accessKeyId: string;
            secretAccessKey: string;
            region: string;
        }) => awsService.connectAccount(accessKeyId, secretAccessKey, region),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: awsKeys.all });
        },
    });
}

/**
 * Hook to disconnect AWS account
 */
export function useDisconnectAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: awsService.disconnectAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: awsKeys.all });
        },
    });
}

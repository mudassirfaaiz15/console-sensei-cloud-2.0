import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSecurityData, updateFindingStatus, runSecurityScan, type SecurityFinding } from '@/lib/api/security';
import { notifications } from '@/lib/notifications';

// Query keys
export const securityKeys = {
    all: ['security'] as const,
    findings: ['security', 'findings'] as const,
    compliance: ['security', 'compliance'] as const,
};

// Fetch all security data
export function useSecurityData() {
    return useQuery({
        queryKey: securityKeys.all,
        queryFn: fetchSecurityData,
        staleTime: 60000, // 1 minute
    });
}

// Update finding status
export function useUpdateFindingStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: SecurityFinding['status'] }) =>
            updateFindingStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.all });
            notifications.success('Finding updated', 'Finding status has been updated');
        },
        onError: (error) => {
            notifications.error('Update failed', error.message);
        },
    });
}

// Run security scan
export function useRunSecurityScan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: runSecurityScan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.all });
            notifications.success('Scan complete', 'Security scan has finished');
        },
        onError: (error) => {
            notifications.error('Scan failed', error.message);
        },
    });
}

// Computed helpers
export function useSecuritySummary() {
    const { data, ...rest } = useSecurityData();

    const summary = data ? {
        score: data.securityScore,
        criticalCount: data.criticalCount,
        highCount: data.highCount,
        totalFindings: data.findings.length,
        openFindings: data.findings.filter(f => f.status === 'open').length,
    } : null;

    return { summary, ...rest };
}

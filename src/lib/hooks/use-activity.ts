import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchActivityLog, logActivity, type ActivityEvent } from '@/lib/api/activity';

// Query keys
export const activityKeys = {
    all: ['activity'] as const,
    list: (limit: number) => ['activity', 'list', limit] as const,
};

// Fetch activity log
export function useActivityLog(limit: number = 50) {
    return useQuery({
        queryKey: activityKeys.list(limit),
        queryFn: () => fetchActivityLog(limit),
        staleTime: 30000, // 30 seconds
    });
}

// Log new activity
export function useLogActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: activityKeys.all });
        },
    });
}

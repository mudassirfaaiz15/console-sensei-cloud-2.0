import { useQuery } from '@tanstack/react-query';
import { fetchCostData, fetchCostTrends } from '@/lib/api/costs';

// Query keys
export const costsKeys = {
    all: ['costs'] as const,
    trends: (months: number) => ['costs', 'trends', months] as const,
};

// Fetch all cost data
export function useCostData() {
    return useQuery({
        queryKey: costsKeys.all,
        queryFn: fetchCostData,
        staleTime: 60000, // 1 minute
    });
}

// Fetch cost trends
export function useCostTrends(months: number = 6) {
    return useQuery({
        queryKey: costsKeys.trends(months),
        queryFn: () => fetchCostTrends(months),
        staleTime: 60000,
    });
}

// Computed helpers
export function useCostSummary() {
    const { data, ...rest } = useCostData();

    const summary = data ? {
        totalCost: data.totalCost,
        potentialSavings: data.potentialSavings,
        savingsPercentage: Math.round((data.potentialSavings / data.totalCost) * 100),
        topService: data.serviceCosts[0]?.name || 'N/A',
        recommendationCount: data.recommendations.length,
    } : null;

    return { summary, ...rest };
}

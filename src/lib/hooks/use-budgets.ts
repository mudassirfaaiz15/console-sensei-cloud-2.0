import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchBudgets,
    fetchBudgetAlerts,
    createBudget,
    updateBudget,
    deleteBudget,
    acknowledgeAlert,
    type Budget,
} from '@/lib/api/budgets';
import { notifications } from '@/lib/notifications';

// Query keys
export const budgetKeys = {
    all: ['budgets'] as const,
    alerts: ['budgets', 'alerts'] as const,
};

// Fetch budgets
export function useBudgets() {
    return useQuery({
        queryKey: budgetKeys.all,
        queryFn: fetchBudgets,
        staleTime: 60000, // 1 minute
    });
}

// Fetch budget alerts
export function useBudgetAlerts() {
    return useQuery({
        queryKey: budgetKeys.alerts,
        queryFn: fetchBudgetAlerts,
        staleTime: 30000,
    });
}

// Create budget
export function useCreateBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBudget,
        onSuccess: (budget) => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
            notifications.success('Budget created', `${budget.name} has been created`);
        },
        onError: (error) => {
            notifications.error('Failed to create budget', error.message);
        },
    });
}

// Update budget
export function useUpdateBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Budget> }) =>
            updateBudget(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
            notifications.success('Budget updated', 'Changes have been saved');
        },
        onError: (error) => {
            notifications.error('Failed to update budget', error.message);
        },
    });
}

// Delete budget
export function useDeleteBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
            notifications.success('Budget deleted', 'The budget has been removed');
        },
        onError: (error) => {
            notifications.error('Failed to delete budget', error.message);
        },
    });
}

// Acknowledge alert
export function useAcknowledgeAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: acknowledgeAlert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.alerts });
        },
    });
}

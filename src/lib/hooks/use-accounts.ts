import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAccounts, addAccount, deleteAccount, syncAccount, type AWSAccount } from '@/lib/api/accounts';
import { notifications } from '@/lib/notifications';

// Query keys
export const accountsKeys = {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', id] as const,
};

// Fetch all accounts
export function useAccounts() {
    return useQuery({
        queryKey: accountsKeys.all,
        queryFn: fetchAccounts,
        staleTime: 30000, // 30 seconds
    });
}

// Add new account
export function useAddAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addAccount,
        onSuccess: (newAccount) => {
            queryClient.invalidateQueries({ queryKey: accountsKeys.all });
            notifications.success('Account added', `${newAccount.name} has been added successfully`);
        },
        onError: (error) => {
            notifications.error('Failed to add account', error.message);
        },
    });
}

// Delete account
export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountsKeys.all });
            notifications.success('Account removed', 'The account has been removed');
        },
        onError: (error) => {
            notifications.error('Failed to remove account', error.message);
        },
    });
}

// Sync account
export function useSyncAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: syncAccount,
        onMutate: async (id) => {
            // Optimistically update to syncing status
            await queryClient.cancelQueries({ queryKey: accountsKeys.all });
            const previousAccounts = queryClient.getQueryData<AWSAccount[]>(accountsKeys.all);

            queryClient.setQueryData<AWSAccount[]>(accountsKeys.all, (old) =>
                old?.map((acc) => acc.id === id ? { ...acc, status: 'syncing' as const } : acc)
            );

            return { previousAccounts };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountsKeys.all });
            notifications.success('Sync complete', 'Account has been synchronized');
        },
        onError: (error, _id, context) => {
            queryClient.setQueryData(accountsKeys.all, context?.previousAccounts);
            notifications.error('Sync failed', error.message);
        },
    });
}

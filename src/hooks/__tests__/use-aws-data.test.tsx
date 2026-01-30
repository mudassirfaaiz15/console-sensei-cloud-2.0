import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResources, useAlerts, useHygieneScore } from '@/hooks/use-aws-data';
import type { ReactNode } from 'react';

// Create wrapper for hooks
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

describe('useResources', () => {
    it('fetches resources successfully', async () => {
        const { result } = renderHook(() => useResources(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.length).toBeGreaterThan(0);
    });
});

describe('useAlerts', () => {
    it('fetches alerts successfully', async () => {
        const { result } = renderHook(() => useAlerts(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(Array.isArray(result.current.data)).toBe(true);
    });
});

describe('useHygieneScore', () => {
    it('fetches hygiene score successfully', async () => {
        const { result } = renderHook(() => useHygieneScore(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.overall).toBeGreaterThan(0);
    });
});

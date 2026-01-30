import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from '@/app/context/auth-context';
import type { ReactElement, ReactNode } from 'react';

// Create a fresh query client for each test
function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });
}

interface AllTheProvidersProps {
    children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

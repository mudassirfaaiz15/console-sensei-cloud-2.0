import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { MultiAccountPage } from '@/app/pages/multi-account-page';

// Mock the notifications module
vi.mock('@/lib/notifications', () => ({
    notifications: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('MultiAccountPage', () => {
    it('renders the page', async () => {
        render(<MultiAccountPage />);

        // Wait for page to fully render
        await waitFor(() => {
            expect(screen.getByText('AWS Accounts')).toBeInTheDocument();
        });
    });

    it('renders add account button', async () => {
        render(<MultiAccountPage />);

        await waitFor(() => {
            expect(screen.getByText('Add Account')).toBeInTheDocument();
        });
    });

    it('displays summary cards', async () => {
        render(<MultiAccountPage />);

        await waitFor(() => {
            expect(screen.getByText('Total Accounts')).toBeInTheDocument();
            expect(screen.getByText('Total Resources')).toBeInTheDocument();
        });
    });
});

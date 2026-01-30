import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { TeamManagementPage } from '@/app/pages/team-management-page';

// Mock the notifications
vi.mock('@/lib/notifications', () => ({
    notifications: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('TeamManagementPage', () => {
    it('renders the page', async () => {
        render(<TeamManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('Team Management')).toBeInTheDocument();
        });
    });

    it('renders invite button', async () => {
        render(<TeamManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('Invite Member')).toBeInTheDocument();
        });
    });

    it('displays team members', async () => {
        render(<TeamManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });
});

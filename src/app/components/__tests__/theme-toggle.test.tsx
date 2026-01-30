import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/app/components/theme-toggle';

describe('ThemeToggle', () => {
    it('renders theme toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
    });

    it('opens dropdown on click', async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);

        const button = screen.getByRole('button', { name: /theme/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByText(/light/i)).toBeInTheDocument();
            expect(screen.getByText(/dark/i)).toBeInTheDocument();
            expect(screen.getByText(/system/i)).toBeInTheDocument();
        });
    });
});

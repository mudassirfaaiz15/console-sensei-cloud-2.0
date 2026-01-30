import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { SecurityAuditPage } from '@/app/pages/security-audit-page';

describe('SecurityAuditPage', () => {
    it('renders the page', async () => {
        render(<SecurityAuditPage />);

        await waitFor(() => {
            expect(screen.getByText('Security Audit')).toBeInTheDocument();
        });
    });

    it('renders run scan button', async () => {
        render(<SecurityAuditPage />);

        await waitFor(() => {
            expect(screen.getByText('Run Scan')).toBeInTheDocument();
        });
    });

    it('displays security findings', async () => {
        render(<SecurityAuditPage />);

        await waitFor(() => {
            expect(screen.getByText('Security Findings')).toBeInTheDocument();
        });
    });
});

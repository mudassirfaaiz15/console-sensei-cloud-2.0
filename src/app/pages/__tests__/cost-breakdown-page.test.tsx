import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { CostBreakdownPage } from '@/app/pages/cost-breakdown-page';

// Mock recharts components
vi.mock('recharts', () => ({
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Area: () => null,
    PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => null,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CostBreakdownPage', () => {
    it('renders the page', async () => {
        render(<CostBreakdownPage />);

        await waitFor(() => {
            expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
        });
    });

    it('renders export button', async () => {
        render(<CostBreakdownPage />);

        await waitFor(() => {
            expect(screen.getByText('Export')).toBeInTheDocument();
        });
    });

    it('displays cost summary', async () => {
        render(<CostBreakdownPage />);

        await waitFor(() => {
            expect(screen.getByText('Current Month')).toBeInTheDocument();
        });
    });
});

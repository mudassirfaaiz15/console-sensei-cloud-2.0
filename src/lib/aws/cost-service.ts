// AWS Cost Explorer Service
// Fetches cost data from AWS Cost Explorer API

import {
    GetCostAndUsageCommand,
    GetCostForecastCommand,
    type GetCostAndUsageCommandOutput,
} from '@aws-sdk/client-cost-explorer';
import { createCostExplorerClient } from './client';
import { hasCredentials } from './credentials';

export interface MonthlyCost {
    month: string;
    cost: number;
}

export interface ServiceCost {
    service: string;
    cost: number;
    percentage: number;
}

export interface CostSummary {
    currentMonthCost: number;
    previousMonthCost: number;
    percentChange: number;
    forecast: number;
    monthlyCosts: MonthlyCost[];
    serviceCosts: ServiceCost[];
}

/**
 * Get date range for queries
 */
function getDateRange(months: number = 6): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
}

/**
 * Get first and last day of current month
 */
function getCurrentMonthRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
}

/**
 * Get first and last day of previous month
 */
function getPreviousMonthRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
}

/**
 * Fetch monthly cost breakdown for the past N months
 */
export async function getMonthlyCosts(months: number = 6): Promise<MonthlyCost[]> {
    if (!hasCredentials()) {
        throw new Error('AWS credentials not configured');
    }

    const client = createCostExplorerClient();
    const { start, end } = getDateRange(months);

    const response: GetCostAndUsageCommandOutput = await client.send(
        new GetCostAndUsageCommand({
            TimePeriod: { Start: start, End: end },
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost'],
        })
    );

    return (response.ResultsByTime || []).map((result) => ({
        month: result.TimePeriod?.Start?.substring(0, 7) || '',
        cost: parseFloat(result.Total?.UnblendedCost?.Amount || '0'),
    }));
}

/**
 * Fetch cost breakdown by service
 */
export async function getServiceCosts(): Promise<ServiceCost[]> {
    if (!hasCredentials()) {
        throw new Error('AWS credentials not configured');
    }

    const client = createCostExplorerClient();
    const { start, end } = getCurrentMonthRange();

    const response = await client.send(
        new GetCostAndUsageCommand({
            TimePeriod: { Start: start, End: end },
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost'],
            GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
        })
    );

    const services: ServiceCost[] = [];
    let totalCost = 0;

    for (const result of response.ResultsByTime || []) {
        for (const group of result.Groups || []) {
            const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
            if (cost > 0) {
                services.push({
                    service: group.Keys?.[0] || 'Unknown',
                    cost,
                    percentage: 0, // Calculate later
                });
                totalCost += cost;
            }
        }
    }

    // Calculate percentages and sort by cost
    return services
        .map((s) => ({ ...s, percentage: (s.cost / totalCost) * 100 }))
        .sort((a, b) => b.cost - a.cost);
}

/**
 * Get cost summary with current month, previous month, and forecast
 */
export async function getCostSummary(): Promise<CostSummary> {
    if (!hasCredentials()) {
        throw new Error('AWS credentials not configured');
    }

    const client = createCostExplorerClient();

    // Get current month cost
    const currentRange = getCurrentMonthRange();
    const currentResponse = await client.send(
        new GetCostAndUsageCommand({
            TimePeriod: currentRange,
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost'],
        })
    );

    const currentMonthCost = parseFloat(
        currentResponse.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || '0'
    );

    // Get previous month cost
    const prevRange = getPreviousMonthRange();
    const prevResponse = await client.send(
        new GetCostAndUsageCommand({
            TimePeriod: prevRange,
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost'],
        })
    );

    const previousMonthCost = parseFloat(
        prevResponse.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || '0'
    );

    // Calculate percent change
    const percentChange = previousMonthCost > 0
        ? ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100
        : 0;

    // Get forecast
    let forecast = currentMonthCost;
    try {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (now < endOfMonth) {
            const forecastResponse = await client.send(
                new GetCostForecastCommand({
                    TimePeriod: {
                        Start: now.toISOString().split('T')[0],
                        End: endOfMonth.toISOString().split('T')[0],
                    },
                    Granularity: 'MONTHLY',
                    Metric: 'UNBLENDED_COST',
                })
            );
            forecast = currentMonthCost + parseFloat(forecastResponse.Total?.Amount || '0');
        }
    } catch {
        // Forecast may fail if not enough data
        forecast = currentMonthCost * 1.1; // Estimate 10% more
    }

    // Get monthly costs and service costs
    const [monthlyCosts, serviceCosts] = await Promise.all([
        getMonthlyCosts(6),
        getServiceCosts(),
    ]);

    return {
        currentMonthCost,
        previousMonthCost,
        percentChange,
        forecast,
        monthlyCosts,
        serviceCosts,
    };
}

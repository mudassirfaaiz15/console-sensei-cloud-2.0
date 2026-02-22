import {
  GetCostAndUsageCommand,
  CostExplorerClient,
  Granularity,
  GroupDefinition,
} from '@aws-sdk/client-cost-explorer';
import { CostData, ScanError } from '../types';

/**
 * Cost Explorer Scanner
 * 
 * Requirements:
 * - 15.1: Fetch cost data for last 30 days
 * - 15.2: Break down costs by service
 * - 15.3: Break down costs by region
 * - 15.4: Break down costs by tag
 * - 15.5: Calculate month-over-month trends
 * 
 * Note: Cost Explorer is a global service
 */

export interface CostScanResult {
  costData: CostData;
  errors: ScanError[];
}

/**
 * Scan AWS costs using Cost Explorer
 * 
 * @param ceClient - Cost Explorer client
 * @returns Cost data and errors
 */
export async function scanCostData(
  ceClient: CostExplorerClient
): Promise<CostScanResult> {
  console.log('Scanning cost data (global service)');

  const errors: ScanError[] = [];

  // Calculate date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  let totalCost = 0;
  let byService: Record<string, number> = {};
  let byRegion: Record<string, number> = {};
  let byTag: Record<string, number> = {};

  // Get total cost
  try {
    const totalCommand = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDateStr,
        End: endDateStr,
      },
      Granularity: Granularity.MONTHLY,
      Metrics: ['UnblendedCost'],
    });

    const totalResponse = await ceClient.send(totalCommand);

    if (totalResponse.ResultsByTime) {
      for (const result of totalResponse.ResultsByTime) {
        const amount = result.Total?.UnblendedCost?.Amount;
        if (amount) {
          totalCost += parseFloat(amount);
        }
      }
    }
  } catch (error) {
    errors.push(createScanError('Cost_Total', 'global', error));
  }

  // Get cost by service
  try {
    const serviceCommand = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDateStr,
        End: endDateStr,
      },
      Granularity: Granularity.MONTHLY,
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        } as GroupDefinition,
      ],
    });

    const serviceResponse = await ceClient.send(serviceCommand);

    if (serviceResponse.ResultsByTime) {
      for (const result of serviceResponse.ResultsByTime) {
        if (result.Groups) {
          for (const group of result.Groups) {
            const serviceName = group.Keys?.[0] || 'Unknown';
            const amount = group.Metrics?.UnblendedCost?.Amount;
            if (amount) {
              byService[serviceName] = (byService[serviceName] || 0) + parseFloat(amount);
            }
          }
        }
      }
    }
  } catch (error) {
    errors.push(createScanError('Cost_ByService', 'global', error));
  }

  // Get cost by region
  try {
    const regionCommand = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDateStr,
        End: endDateStr,
      },
      Granularity: Granularity.MONTHLY,
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'REGION',
        } as GroupDefinition,
      ],
    });

    const regionResponse = await ceClient.send(regionCommand);

    if (regionResponse.ResultsByTime) {
      for (const result of regionResponse.ResultsByTime) {
        if (result.Groups) {
          for (const group of result.Groups) {
            const regionName = group.Keys?.[0] || 'Unknown';
            const amount = group.Metrics?.UnblendedCost?.Amount;
            if (amount) {
              byRegion[regionName] = (byRegion[regionName] || 0) + parseFloat(amount);
            }
          }
        }
      }
    }
  } catch (error) {
    errors.push(createScanError('Cost_ByRegion', 'global', error));
  }

  // Get cost by tag (using Environment tag as example)
  try {
    const tagCommand = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDateStr,
        End: endDateStr,
      },
      Granularity: Granularity.MONTHLY,
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'TAG',
          Key: 'Environment',
        } as GroupDefinition,
      ],
    });

    const tagResponse = await ceClient.send(tagCommand);

    if (tagResponse.ResultsByTime) {
      for (const result of tagResponse.ResultsByTime) {
        if (result.Groups) {
          for (const group of result.Groups) {
            const tagValue = group.Keys?.[0] || 'Untagged';
            const amount = group.Metrics?.UnblendedCost?.Amount;
            if (amount) {
              byTag[tagValue] = (byTag[tagValue] || 0) + parseFloat(amount);
            }
          }
        }
      }
    }
  } catch (error) {
    // Tag-based grouping might fail if tag doesn't exist, which is okay
    console.warn('Failed to get cost by tag', { error });
  }

  const costData: CostData = {
    estimatedMonthly: totalCost,
    byService,
    byRegion,
    byTag,
  };

  console.log('Cost scan completed', {
    totalCost,
    serviceCount: Object.keys(byService).length,
    regionCount: Object.keys(byRegion).length,
    errorCount: errors.length,
  });

  return { costData, errors };
}

/**
 * Calculate month-over-month cost trend
 * 
 * @param ceClient - Cost Explorer client
 * @returns Trend data showing cost change percentage
 */
export async function calculateCostTrend(
  ceClient: CostExplorerClient
): Promise<{
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  errors: ScanError[];
}> {
  console.log('Calculating cost trend');

  const errors: ScanError[] = [];

  // Get current month dates
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get previous month dates
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let currentMonth = 0;
  let previousMonth = 0;

  // Get current month cost
  try {
    const currentCommand = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: currentMonthStart.toISOString().split('T')[0],
        End: currentMonthEnd.toISOString().split('T')[0],
      },
      Granularity: Granularity.MONTHLY,
      Metrics: ['UnblendedCost'],
    });

    const currentResponse = await ceClient.send(currentCommand);

    if (currentResponse.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount) {
      currentMonth = parseFloat(currentResponse.ResultsByTime[0].Total.UnblendedCost.Amount);
    }
  } catch (error) {
    errors.push(createScanError('Cost_CurrentMonth', 'global', error));
  }

  // Get previous month cost
  try {
    const previousCommand = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: previousMonthStart.toISOString().split('T')[0],
        End: previousMonthEnd.toISOString().split('T')[0],
      },
      Granularity: Granularity.MONTHLY,
      Metrics: ['UnblendedCost'],
    });

    const previousResponse = await ceClient.send(previousCommand);

    if (previousResponse.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount) {
      previousMonth = parseFloat(previousResponse.ResultsByTime[0].Total.UnblendedCost.Amount);
    }
  } catch (error) {
    errors.push(createScanError('Cost_PreviousMonth', 'global', error));
  }

  // Calculate change percentage
  let changePercent = 0;
  if (previousMonth > 0) {
    changePercent = ((currentMonth - previousMonth) / previousMonth) * 100;
  }

  console.log('Cost trend calculated', {
    currentMonth,
    previousMonth,
    changePercent: changePercent.toFixed(2) + '%',
  });

  return {
    currentMonth,
    previousMonth,
    changePercent,
    errors,
  };
}

/**
 * Create a scan error object
 */
function createScanError(service: string, region: string, error: unknown): ScanError {
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  console.error('Scan error', { service, region, error: message });
  
  return {
    type: 'scan_error',
    service,
    region,
    message,
    timestamp: new Date().toISOString(),
  };
}

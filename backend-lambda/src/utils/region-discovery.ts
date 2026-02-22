import { DescribeRegionsCommand, DescribeRegionsCommandOutput } from '@aws-sdk/client-ec2';
import { AWSClients } from './aws-clients';

/**
 * Region Discovery Utility
 * 
 * Requirements:
 * - 3.1: Discover all enabled AWS regions using EC2 DescribeRegions
 */

/**
 * Discover all enabled AWS regions for the account
 * 
 * Uses EC2 DescribeRegions API to get the list of regions that are enabled
 * for the AWS account. This ensures we only scan regions that are accessible.
 * 
 * @param clients - AWS SDK clients
 * @returns Array of enabled region names
 */
export async function discoverEnabledRegions(clients: AWSClients): Promise<string[]> {
  console.log('Discovering enabled AWS regions');

  try {
    const command = new DescribeRegionsCommand({
      AllRegions: false, // Only return enabled regions
      Filters: [
        {
          Name: 'opt-in-status',
          Values: ['opt-in-not-required', 'opted-in'],
        },
      ],
    });

    const response: DescribeRegionsCommandOutput = await clients.ec2.send(command);

    if (!response.Regions || response.Regions.length === 0) {
      console.warn('No enabled regions found, using default regions');
      return getDefaultRegions();
    }

    const regions = response.Regions
      .map(region => region.RegionName)
      .filter((name): name is string => name !== undefined)
      .sort();

    console.log('Discovered enabled regions', { 
      count: regions.length, 
      regions 
    });

    return regions;
  } catch (error) {
    console.error('Failed to discover regions', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    // Fallback to default regions if discovery fails
    console.warn('Falling back to default regions');
    return getDefaultRegions();
  }
}

/**
 * Get default AWS regions as fallback
 * Returns commonly used regions if region discovery fails
 */
function getDefaultRegions(): string[] {
  return [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-central-1',
    'ap-southeast-1',
    'ap-northeast-1',
  ];
}

/**
 * Check if a region is valid AWS region
 * 
 * @param region - Region name to validate
 * @returns True if region is valid
 */
export function isValidRegion(region: string): boolean {
  // AWS region format: 2-3 letter region code, dash, direction, dash, number
  // Examples: us-east-1, eu-west-2, ap-southeast-1
  const regionPattern = /^[a-z]{2,3}-[a-z]+-\d+$/;
  return regionPattern.test(region);
}

/**
 * Filter out invalid regions from a list
 * 
 * @param regions - Array of region names
 * @returns Array of valid region names
 */
export function filterValidRegions(regions: string[]): string[] {
  return regions.filter(isValidRegion);
}

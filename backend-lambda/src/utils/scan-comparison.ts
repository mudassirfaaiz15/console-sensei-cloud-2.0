import { ScanResult, ScoreResult, Issue } from '../types';

/**
 * Scan comparison utility for detecting changes between scans
 * 
 * Requirements:
 * - 10.3: Compare current scan with previous scan
 * - 10.3: Identify new resources, deleted resources, changed states
 * - 10.3: Identify new security issues
 * - 10.3: Calculate hygiene score change
 * - 10.3: Calculate cost change
 */

export interface ScanComparison {
  newResources: string[]; // Resource IDs
  deletedResources: string[]; // Resource IDs
  changedResources: string[]; // Resource IDs
  newSecurityIssues: Issue[];
  resolvedSecurityIssues: Issue[];
  resourceCountChange: number;
  costChange: number; // Percentage change
  costDifference: number; // Absolute difference
  summary: string;
}

/**
 * Compare two scans to identify differences
 * 
 * @param currentScan - The current scan result
 * @param previousScan - The previous scan result (can be null if first scan)
 * @param currentScore - The current hygiene score
 * @param previousScore - The previous hygiene score (can be null if first scan)
 * @returns Comparison object with identified differences
 */
export function compareScan(
  currentScan: ScanResult,
  previousScan: ScanResult | null,
  currentScore: ScoreResult,
  previousScore: ScoreResult | null
): ScanComparison {
  if (!previousScan || !previousScore) {
    // First scan - no previous data to compare
    return {
      newResources: currentScan.resources.map(r => r.resourceId),
      deletedResources: [],
      changedResources: [],
      newSecurityIssues: currentScore.breakdown.security.issues,
      resolvedSecurityIssues: [],
      resourceCountChange: currentScan.resources.length,
      costChange: 0,
      costDifference: currentScan.costData?.estimatedMonthly || 0,
      summary: `Initial scan completed with ${currentScan.resources.length} resources detected.`,
    };
  }

  // Create maps for quick lookup
  const currentResourceMap = new Map(
    currentScan.resources.map(r => [r.resourceId, r])
  );
  const previousResourceMap = new Map(
    previousScan.resources.map(r => [r.resourceId, r])
  );

  // Identify new, deleted, and changed resources
  const newResources: string[] = [];
  const deletedResources: string[] = [];
  const changedResources: string[] = [];

  // Find new and changed resources
  for (const [resourceId, currentResource] of currentResourceMap) {
    if (!previousResourceMap.has(resourceId)) {
      newResources.push(resourceId);
    } else {
      const previousResource = previousResourceMap.get(resourceId)!;
      if (currentResource.state !== previousResource.state) {
        changedResources.push(resourceId);
      }
    }
  }

  // Find deleted resources
  for (const resourceId of previousResourceMap.keys()) {
    if (!currentResourceMap.has(resourceId)) {
      deletedResources.push(resourceId);
    }
  }

  // Compare security issues
  const currentSecurityIssueIds = new Set(
    currentScore.breakdown.security.issues.map(i => `${i.type}:${i.resourceId}`)
  );
  const previousSecurityIssueIds = new Set(
    previousScore.breakdown.security.issues.map(i => `${i.type}:${i.resourceId}`)
  );

  const newSecurityIssues = currentScore.breakdown.security.issues.filter(
    issue => !previousSecurityIssueIds.has(`${issue.type}:${issue.resourceId}`)
  );

  const resolvedSecurityIssues = previousScore.breakdown.security.issues.filter(
    issue => !currentSecurityIssueIds.has(`${issue.type}:${issue.resourceId}`)
  );

  // Calculate cost change
  const currentCost = currentScan.costData?.estimatedMonthly || 0;
  const previousCost = previousScan.costData?.estimatedMonthly || 0;
  const costDifference = currentCost - previousCost;
  const costChange = previousCost > 0 ? (costDifference / previousCost) * 100 : 0;

  // Generate summary
  const summary = generateSummary({
    newResources: newResources.length,
    deletedResources: deletedResources.length,
    changedResources: changedResources.length,
    newSecurityIssues: newSecurityIssues.length,
    resolvedSecurityIssues: resolvedSecurityIssues.length,
    scoreChange: currentScore.overallScore - previousScore.overallScore,
    costChange,
  });

  return {
    newResources,
    deletedResources,
    changedResources,
    newSecurityIssues,
    resolvedSecurityIssues,
    resourceCountChange: currentScan.resources.length - previousScan.resources.length,
    costChange,
    costDifference,
    summary,
  };
}

/**
 * Generate a human-readable summary of scan comparison
 */
function generateSummary(changes: {
  newResources: number;
  deletedResources: number;
  changedResources: number;
  newSecurityIssues: number;
  resolvedSecurityIssues: number;
  scoreChange: number;
  costChange: number;
}): string {
  const parts: string[] = [];

  if (changes.newResources > 0) {
    parts.push(`${changes.newResources} new resource(s) detected`);
  }

  if (changes.deletedResources > 0) {
    parts.push(`${changes.deletedResources} resource(s) deleted`);
  }

  if (changes.changedResources > 0) {
    parts.push(`${changes.changedResources} resource(s) changed state`);
  }

  if (changes.newSecurityIssues > 0) {
    parts.push(`${changes.newSecurityIssues} new security issue(s)`);
  }

  if (changes.resolvedSecurityIssues > 0) {
    parts.push(`${changes.resolvedSecurityIssues} security issue(s) resolved`);
  }

  if (changes.scoreChange !== 0) {
    const direction = changes.scoreChange > 0 ? 'increased' : 'decreased';
    parts.push(`hygiene score ${direction} by ${Math.abs(changes.scoreChange).toFixed(1)}`);
  }

  if (changes.costChange !== 0) {
    const direction = changes.costChange > 0 ? 'increased' : 'decreased';
    parts.push(`estimated monthly cost ${direction} by ${Math.abs(changes.costChange).toFixed(1)}%`);
  }

  if (parts.length === 0) {
    return 'No significant changes detected since last scan.';
  }

  return parts.join(', ') + '.';
}

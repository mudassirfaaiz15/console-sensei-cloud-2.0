import { ScanResult, Resource } from '../types';

/**
 * Architecture Diagram Generator
 * 
 * Generates ASCII-based architecture diagrams showing:
 * - VPCs, subnets, and network boundaries
 * - Compute resources (EC2, Lambda, ECS)
 * - Data stores (RDS, DynamoDB, S3)
 * - Network connections and load balancers
 * 
 * Requirements:
 * - 13.2: Show VPCs, subnets, and network boundaries
 * - 13.3: Show compute resources (EC2, Lambda, ECS)
 * - 13.4: Show data stores (RDS, DynamoDB, S3)
 * - 13.5: Show network connections and load balancers
 * - 13.6: Use standard diagram format (PNG or SVG)
 * - 13.7: Support exporting diagrams in multiple formats
 */

interface NetworkComponent {
  type: string;
  name: string;
  region: string;
  resources: Resource[];
}

/**
 * Generate an ASCII architecture diagram from scan results
 * 
 * @param scanResult - Scan results containing resources
 * @returns ASCII diagram as string
 */
export function generateArchitectureDiagram(scanResult: ScanResult): string {
  const resources = scanResult.resources;

  // Group resources by region and type
  const byRegion = groupByRegion(resources);
  const diagram = buildDiagram(byRegion);

  return diagram;
}

/**
 * Generate SVG diagram from scan results
 * 
 * @param scanResult - Scan results containing resources
 * @returns SVG diagram as string
 */
export function generateSVGDiagram(scanResult: ScanResult): string {
  const resources = scanResult.resources;
  const byRegion = groupByRegion(resources);

  return buildSVGDiagram(byRegion);
}

function groupByRegion(resources: Resource[]): Record<string, Record<string, Resource[]>> {
  const grouped: Record<string, Record<string, Resource[]>> = {};

  resources.forEach((resource) => {
    if (!grouped[resource.region]) {
      grouped[resource.region] = {};
    }

    const type = resource.resourceType;
    if (!grouped[resource.region][type]) {
      grouped[resource.region][type] = [];
    }

    grouped[resource.region][type].push(resource);
  });

  return grouped;
}

function buildDiagram(byRegion: Record<string, Record<string, Resource[]>>): string {
  let diagram = '';

  diagram += '╔════════════════════════════════════════════════════════════════╗\n';
  diagram += '║                    AWS Architecture Diagram                    ║\n';
  diagram += '╚════════════════════════════════════════════════════════════════╝\n\n';

  Object.entries(byRegion).forEach(([region, resourcesByType]) => {
    diagram += `┌─ Region: ${region} ${'─'.repeat(50 - region.length)}\n`;

    // VPCs and Subnets
    const vpcs = resourcesByType['VPC'] || [];
    const subnets = resourcesByType['Subnet'] || [];

    if (vpcs.length > 0) {
      diagram += `│  ┌─ VPCs (${vpcs.length})\n`;
      vpcs.forEach((vpc) => {
        diagram += `│  │  • ${vpc.resourceName || vpc.resourceId}\n`;
      });
      diagram += `│  └─\n`;
    }

    if (subnets.length > 0) {
      diagram += `│  ┌─ Subnets (${subnets.length})\n`;
      subnets.slice(0, 3).forEach((subnet) => {
        diagram += `│  │  • ${subnet.resourceName || subnet.resourceId}\n`;
      });
      if (subnets.length > 3) {
        diagram += `│  │  ... and ${subnets.length - 3} more\n`;
      }
      diagram += `│  └─\n`;
    }

    // Compute Resources
    const computeTypes = ['EC2_Instance', 'Lambda_Function', 'ECS_Task'];
    const computeResources = computeTypes
      .flatMap((type) => resourcesByType[type] || [])
      .slice(0, 5);

    if (computeResources.length > 0) {
      diagram += `│  ┌─ Compute Resources (${computeTypes.map((t) => resourcesByType[t]?.length || 0).reduce((a, b) => a + b, 0)})\n`;
      computeResources.forEach((resource) => {
        diagram += `│  │  • [${resource.resourceType}] ${resource.resourceName || resource.resourceId}\n`;
      });
      diagram += `│  └─\n`;
    }

    // Data Stores
    const dataStoreTypes = ['RDS_Instance', 'DynamoDB', 'S3_Bucket'];
    const dataStores = dataStoreTypes
      .flatMap((type) => resourcesByType[type] || [])
      .slice(0, 5);

    if (dataStores.length > 0) {
      diagram += `│  ┌─ Data Stores (${dataStoreTypes.map((t) => resourcesByType[t]?.length || 0).reduce((a, b) => a + b, 0)})\n`;
      dataStores.forEach((resource) => {
        diagram += `│  │  • [${resource.resourceType}] ${resource.resourceName || resource.resourceId}\n`;
      });
      diagram += `│  └─\n`;
    }

    // Network Resources
    const networkTypes = ['Load_Balancer', 'NAT_Gateway', 'Security_Group'];
    const networkResources = networkTypes
      .flatMap((type) => resourcesByType[type] || [])
      .slice(0, 5);

    if (networkResources.length > 0) {
      diagram += `│  ┌─ Network Resources (${networkTypes.map((t) => resourcesByType[t]?.length || 0).reduce((a, b) => a + b, 0)})\n`;
      networkResources.forEach((resource) => {
        diagram += `│  │  • [${resource.resourceType}] ${resource.resourceName || resource.resourceId}\n`;
      });
      diagram += `│  └─\n`;
    }

    diagram += `└─\n\n`;
  });

  return diagram;
}

function buildSVGDiagram(byRegion: Record<string, Record<string, Resource[]>>): string {
  const width = 1200;
  const height = 800;
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `  <defs>\n`;
  svg += `    <style>\n`;
  svg += `      .region-box { fill: #f0f9ff; stroke: #0284c7; stroke-width: 2; }\n`;
  svg += `      .region-label { font-size: 14px; font-weight: bold; fill: #0284c7; }\n`;
  svg += `      .resource-box { fill: #dbeafe; stroke: #0284c7; stroke-width: 1; }\n`;
  svg += `      .resource-label { font-size: 11px; fill: #000; }\n`;
  svg += `      .compute { fill: #fef3c7; stroke: #d97706; }\n`;
  svg += `      .storage { fill: #ddd6fe; stroke: #7c3aed; }\n`;
  svg += `      .network { fill: #fecaca; stroke: #dc2626; }\n`;
  svg += `    </style>\n`;
  svg += `  </defs>\n`;

  let yOffset = 20;
  const regionHeight = 150;
  const boxWidth = 150;
  const boxHeight = 40;

  Object.entries(byRegion).forEach(([region, resourcesByType]) => {
    // Region box
    svg += `  <rect x="10" y="${yOffset}" width="${width - 20}" height="${regionHeight}" class="region-box" />\n`;
    svg += `  <text x="20" y="${yOffset + 25}" class="region-label">Region: ${region}</text>\n`;

    let xOffset = 30;
    let currentY = yOffset + 50;

    // Compute resources
    const computeResources = (resourcesByType['EC2_Instance'] || []).slice(0, 3);
    if (computeResources.length > 0) {
      computeResources.forEach((resource, index) => {
        svg += `  <rect x="${xOffset}" y="${currentY}" width="${boxWidth}" height="${boxHeight}" class="resource-box compute" />\n`;
        svg += `  <text x="${xOffset + 5}" y="${currentY + 15}" class="resource-label">${resource.resourceType}</text>\n`;
        svg += `  <text x="${xOffset + 5}" y="${currentY + 28}" class="resource-label">${(resource.resourceName || resource.resourceId).substring(0, 15)}</text>\n`;
        xOffset += boxWidth + 10;
      });
    }

    // Data stores
    const dataStores = (resourcesByType['RDS_Instance'] || []).slice(0, 2);
    if (dataStores.length > 0) {
      dataStores.forEach((resource) => {
        svg += `  <rect x="${xOffset}" y="${currentY}" width="${boxWidth}" height="${boxHeight}" class="resource-box storage" />\n`;
        svg += `  <text x="${xOffset + 5}" y="${currentY + 15}" class="resource-label">${resource.resourceType}</text>\n`;
        svg += `  <text x="${xOffset + 5}" y="${currentY + 28}" class="resource-label">${(resource.resourceName || resource.resourceId).substring(0, 15)}</text>\n`;
        xOffset += boxWidth + 10;
      });
    }

    yOffset += regionHeight + 20;
  });

  svg += `</svg>\n`;
  return svg;
}

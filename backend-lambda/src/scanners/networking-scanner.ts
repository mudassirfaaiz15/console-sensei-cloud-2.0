import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeNatGatewaysCommand,
  DescribeVpnConnectionsCommand,
  DescribeTransitGatewaysCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { Resource, ScanError } from '../types';

/**
 * Networking Resource Scanner
 * 
 * Requirements:
 * - 3.6: Scan load balancers (ALB, NLB, CLB), NAT gateways, VPN connections, and Transit Gateways
 */

export interface NetworkingScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all networking resources in a region
 * 
 * @param elbClient - ELB v2 client for the region
 * @param ec2Client - EC2 client for the region
 * @param region - AWS region
 * @returns Networking resources and errors
 */
export async function scanNetworkingResources(
  elbClient: ElasticLoadBalancingV2Client,
  ec2Client: EC2Client,
  region: string
): Promise<NetworkingScanResult> {
  console.log('Scanning networking resources', { region });

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  // Scan Load Balancers
  try {
    const loadBalancers = await scanLoadBalancers(elbClient, region);
    resources.push(...loadBalancers);
  } catch (error) {
    errors.push(createScanError('Load_Balancers', region, error));
  }

  // Scan NAT Gateways
  try {
    const natGateways = await scanNATGateways(ec2Client, region);
    resources.push(...natGateways);
  } catch (error) {
    errors.push(createScanError('NAT_Gateways', region, error));
  }

  // Scan VPN Connections
  try {
    const vpnConnections = await scanVPNConnections(ec2Client, region);
    resources.push(...vpnConnections);
  } catch (error) {
    errors.push(createScanError('VPN_Connections', region, error));
  }

  // Scan Transit Gateways
  try {
    const transitGateways = await scanTransitGateways(ec2Client, region);
    resources.push(...transitGateways);
  } catch (error) {
    errors.push(createScanError('Transit_Gateways', region, error));
  }

  console.log('Networking scan completed', {
    region,
    resourceCount: resources.length,
    errorCount: errors.length,
  });

  return { resources, errors };
}

/**
 * Scan Load Balancers (ALB, NLB, CLB)
 */
async function scanLoadBalancers(
  elbClient: ElasticLoadBalancingV2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeLoadBalancersCommand({});
  const response = await elbClient.send(command);

  const resources: Resource[] = [];

  if (response.LoadBalancers) {
    for (const lb of response.LoadBalancers) {
      if (!lb.LoadBalancerArn) continue;

      // Tags are not included in DescribeLoadBalancers response
      // Would need separate DescribeTags call
      const tags: Record<string, string> = {};
      const name = lb.LoadBalancerName || lb.LoadBalancerArn;

      resources.push({
        resourceId: lb.LoadBalancerArn,
        resourceName: name,
        resourceType: 'Load_Balancer',
        region,
        state: lb.State?.Code || 'unknown',
        creationDate: lb.CreatedTime?.toISOString(),
        tags,
        metadata: {
          type: lb.Type,
          scheme: lb.Scheme,
          vpcId: lb.VpcId,
          availabilityZones: lb.AvailabilityZones?.map(az => ({
            zoneName: az.ZoneName,
            subnetId: az.SubnetId,
          })),
          dnsName: lb.DNSName,
          canonicalHostedZoneId: lb.CanonicalHostedZoneId,
          securityGroups: lb.SecurityGroups,
          ipAddressType: lb.IpAddressType,
        },
      });
    }
  }

  console.log('Scanned Load Balancers', { region, count: resources.length });
  return resources;
}

/**
 * Scan NAT Gateways
 */
async function scanNATGateways(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeNatGatewaysCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.NatGateways) {
    for (const natGw of response.NatGateways) {
      if (!natGw.NatGatewayId) continue;

      const tags = extractEC2Tags(natGw.Tags);
      const name = tags.Name || natGw.NatGatewayId;

      resources.push({
        resourceId: natGw.NatGatewayId,
        resourceName: name,
        resourceType: 'NAT_Gateway',
        region,
        state: natGw.State || 'unknown',
        creationDate: natGw.CreateTime?.toISOString(),
        tags,
        metadata: {
          vpcId: natGw.VpcId,
          subnetId: natGw.SubnetId,
          connectivityType: natGw.ConnectivityType,
          natGatewayAddresses: natGw.NatGatewayAddresses?.map(addr => ({
            publicIp: addr.PublicIp,
            privateIp: addr.PrivateIp,
            networkInterfaceId: addr.NetworkInterfaceId,
            allocationId: addr.AllocationId,
          })),
        },
      });
    }
  }

  console.log('Scanned NAT Gateways', { region, count: resources.length });
  return resources;
}

/**
 * Scan VPN Connections
 */
async function scanVPNConnections(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeVpnConnectionsCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.VpnConnections) {
    for (const vpn of response.VpnConnections) {
      if (!vpn.VpnConnectionId) continue;

      const tags = extractEC2Tags(vpn.Tags);
      const name = tags.Name || vpn.VpnConnectionId;

      resources.push({
        resourceId: vpn.VpnConnectionId,
        resourceName: name,
        resourceType: 'Load_Balancer', // Using Load_Balancer type for VPN
        region,
        state: vpn.State || 'unknown',
        tags,
        metadata: {
          type: vpn.Type,
          category: vpn.Category,
          vpnGatewayId: vpn.VpnGatewayId,
          customerGatewayId: vpn.CustomerGatewayId,
          transitGatewayId: vpn.TransitGatewayId,
          vgwTelemetry: vpn.VgwTelemetry?.map(t => ({
            outsideIpAddress: t.OutsideIpAddress,
            status: t.Status,
            lastStatusChange: t.LastStatusChange?.toISOString(),
          })),
          options: vpn.Options ? {
            staticRoutesOnly: vpn.Options.StaticRoutesOnly,
            tunnelInsideIpVersion: vpn.Options.TunnelInsideIpVersion,
          } : undefined,
          isVPN: true,
        },
      });
    }
  }

  console.log('Scanned VPN Connections', { region, count: resources.length });
  return resources;
}

/**
 * Scan Transit Gateways
 */
async function scanTransitGateways(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeTransitGatewaysCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.TransitGateways) {
    for (const tgw of response.TransitGateways) {
      if (!tgw.TransitGatewayId) continue;

      const tags = extractEC2Tags(tgw.Tags);
      const name = tags.Name || tgw.TransitGatewayId;

      resources.push({
        resourceId: tgw.TransitGatewayId,
        resourceName: name,
        resourceType: 'Load_Balancer', // Using Load_Balancer type for TGW
        region,
        state: tgw.State || 'unknown',
        creationDate: tgw.CreationTime?.toISOString(),
        tags,
        metadata: {
          transitGatewayArn: tgw.TransitGatewayArn,
          ownerId: tgw.OwnerId,
          description: tgw.Description,
          options: tgw.Options ? {
            amazonSideAsn: tgw.Options.AmazonSideAsn,
            autoAcceptSharedAttachments: tgw.Options.AutoAcceptSharedAttachments,
            defaultRouteTableAssociation: tgw.Options.DefaultRouteTableAssociation,
            defaultRouteTablePropagation: tgw.Options.DefaultRouteTablePropagation,
            vpnEcmpSupport: tgw.Options.VpnEcmpSupport,
            dnsSupport: tgw.Options.DnsSupport,
            multicastSupport: tgw.Options.MulticastSupport,
          } : undefined,
          isTransitGateway: true,
        },
      });
    }
  }

  console.log('Scanned Transit Gateways', { region, count: resources.length });
  return resources;
}

/**
 * Extract tags from ELB tag array
 */
function extractTags(tags?: Array<{ Key?: string; Value?: string }>): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (tags) {
    for (const tag of tags) {
      if (tag.Key && tag.Value !== undefined) {
        result[tag.Key] = tag.Value;
      }
    }
  }
  
  return result;
}

/**
 * Extract tags from EC2 tag array
 */
function extractEC2Tags(tags?: Array<{ Key?: string; Value?: string }>): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (tags) {
    for (const tag of tags) {
      if (tag.Key && tag.Value !== undefined) {
        result[tag.Key] = tag.Value;
      }
    }
  }
  
  return result;
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

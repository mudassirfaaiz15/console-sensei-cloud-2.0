import {
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { Resource, ScanError } from '../types';

/**
 * EC2 Resource Scanner
 * 
 * Requirements:
 * - 3.2: Scan EC2 instances, EBS volumes, Elastic IPs, security groups, and VPCs
 */

export interface EC2ScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all EC2 resources in a region
 * 
 * @param ec2Client - EC2 client for the region
 * @param region - AWS region
 * @returns EC2 resources and errors
 */
export async function scanEC2Resources(
  ec2Client: EC2Client,
  region: string
): Promise<EC2ScanResult> {
  console.log('Scanning EC2 resources', { region });

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  // Scan EC2 instances
  try {
    const instances = await scanEC2Instances(ec2Client, region);
    resources.push(...instances);
  } catch (error) {
    errors.push(createScanError('EC2_Instances', region, error));
  }

  // Scan EBS volumes
  try {
    const volumes = await scanEBSVolumes(ec2Client, region);
    resources.push(...volumes);
  } catch (error) {
    errors.push(createScanError('EBS_Volumes', region, error));
  }

  // Scan Elastic IPs
  try {
    const elasticIPs = await scanElasticIPs(ec2Client, region);
    resources.push(...elasticIPs);
  } catch (error) {
    errors.push(createScanError('Elastic_IPs', region, error));
  }

  // Scan Security Groups
  try {
    const securityGroups = await scanSecurityGroups(ec2Client, region);
    resources.push(...securityGroups);
  } catch (error) {
    errors.push(createScanError('Security_Groups', region, error));
  }

  // Scan VPCs
  try {
    const vpcs = await scanVPCs(ec2Client, region);
    resources.push(...vpcs);
  } catch (error) {
    errors.push(createScanError('VPCs', region, error));
  }

  // Scan Subnets
  try {
    const subnets = await scanSubnets(ec2Client, region);
    resources.push(...subnets);
  } catch (error) {
    errors.push(createScanError('Subnets', region, error));
  }

  console.log('EC2 scan completed', {
    region,
    resourceCount: resources.length,
    errorCount: errors.length,
  });

  return { resources, errors };
}

/**
 * Scan EC2 instances with metadata
 */
async function scanEC2Instances(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeInstancesCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.Reservations) {
    for (const reservation of response.Reservations) {
      if (reservation.Instances) {
        for (const instance of reservation.Instances) {
          if (!instance.InstanceId) continue;

          const tags = extractTags(instance.Tags);
          const name = tags.Name || instance.InstanceId;

          resources.push({
            resourceId: instance.InstanceId,
            resourceName: name,
            resourceType: 'EC2_Instance',
            region,
            state: instance.State?.Name || 'unknown',
            creationDate: instance.LaunchTime?.toISOString(),
            tags,
            metadata: {
              instanceType: instance.InstanceType,
              availabilityZone: instance.Placement?.AvailabilityZone,
              privateIpAddress: instance.PrivateIpAddress,
              publicIpAddress: instance.PublicIpAddress,
              vpcId: instance.VpcId,
              subnetId: instance.SubnetId,
              securityGroups: instance.SecurityGroups?.map(sg => ({
                id: sg.GroupId,
                name: sg.GroupName,
              })),
              monitoring: instance.Monitoring?.State,
              platform: instance.Platform,
              architecture: instance.Architecture,
            },
          });
        }
      }
    }
  }

  console.log('Scanned EC2 instances', { region, count: resources.length });
  return resources;
}

/**
 * Scan EBS volumes with metadata
 */
async function scanEBSVolumes(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeVolumesCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.Volumes) {
    for (const volume of response.Volumes) {
      if (!volume.VolumeId) continue;

      const tags = extractTags(volume.Tags);
      const name = tags.Name || volume.VolumeId;

      resources.push({
        resourceId: volume.VolumeId,
        resourceName: name,
        resourceType: 'EBS_Volume',
        region,
        state: volume.State || 'unknown',
        creationDate: volume.CreateTime?.toISOString(),
        tags,
        metadata: {
          size: volume.Size,
          volumeType: volume.VolumeType,
          encrypted: volume.Encrypted,
          availabilityZone: volume.AvailabilityZone,
          attachments: volume.Attachments?.map(att => ({
            instanceId: att.InstanceId,
            device: att.Device,
            state: att.State,
            attachTime: att.AttachTime?.toISOString(),
          })),
          iops: volume.Iops,
          throughput: volume.Throughput,
          snapshotId: volume.SnapshotId,
        },
      });
    }
  }

  console.log('Scanned EBS volumes', { region, count: resources.length });
  return resources;
}

/**
 * Scan Elastic IPs with association status
 */
async function scanElasticIPs(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeAddressesCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.Addresses) {
    for (const address of response.Addresses) {
      if (!address.AllocationId && !address.PublicIp) continue;

      const resourceId = address.AllocationId || address.PublicIp || 'unknown';
      const tags = extractTags(address.Tags);
      const name = tags.Name || resourceId;

      resources.push({
        resourceId,
        resourceName: name,
        resourceType: 'Elastic_IP',
        region,
        state: address.AssociationId ? 'associated' : 'unassociated',
        tags,
        metadata: {
          publicIp: address.PublicIp,
          privateIpAddress: address.PrivateIpAddress,
          associationId: address.AssociationId,
          instanceId: address.InstanceId,
          networkInterfaceId: address.NetworkInterfaceId,
          domain: address.Domain,
        },
      });
    }
  }

  console.log('Scanned Elastic IPs', { region, count: resources.length });
  return resources;
}

/**
 * Scan Security Groups with ingress/egress rules
 */
async function scanSecurityGroups(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeSecurityGroupsCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.SecurityGroups) {
    for (const sg of response.SecurityGroups) {
      if (!sg.GroupId) continue;

      const tags = extractTags(sg.Tags);
      const name = sg.GroupName || sg.GroupId;

      resources.push({
        resourceId: sg.GroupId,
        resourceName: name,
        resourceType: 'Security_Group',
        region,
        state: 'active',
        tags,
        metadata: {
          description: sg.Description,
          vpcId: sg.VpcId,
          ingressRules: sg.IpPermissions?.map(rule => ({
            ipProtocol: rule.IpProtocol,
            fromPort: rule.FromPort,
            toPort: rule.ToPort,
            ipRanges: rule.IpRanges?.map(r => r.CidrIp),
            ipv6Ranges: rule.Ipv6Ranges?.map(r => r.CidrIpv6),
            userIdGroupPairs: rule.UserIdGroupPairs?.map(p => ({
              groupId: p.GroupId,
              groupName: p.GroupName,
            })),
          })),
          egressRules: sg.IpPermissionsEgress?.map(rule => ({
            ipProtocol: rule.IpProtocol,
            fromPort: rule.FromPort,
            toPort: rule.ToPort,
            ipRanges: rule.IpRanges?.map(r => r.CidrIp),
            ipv6Ranges: rule.Ipv6Ranges?.map(r => r.CidrIpv6),
            userIdGroupPairs: rule.UserIdGroupPairs?.map(p => ({
              groupId: p.GroupId,
              groupName: p.GroupName,
            })),
          })),
        },
      });
    }
  }

  console.log('Scanned Security Groups', { region, count: resources.length });
  return resources;
}

/**
 * Scan VPCs
 */
async function scanVPCs(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeVpcsCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.Vpcs) {
    for (const vpc of response.Vpcs) {
      if (!vpc.VpcId) continue;

      const tags = extractTags(vpc.Tags);
      const name = tags.Name || vpc.VpcId;

      resources.push({
        resourceId: vpc.VpcId,
        resourceName: name,
        resourceType: 'VPC',
        region,
        state: vpc.State || 'unknown',
        tags,
        metadata: {
          cidrBlock: vpc.CidrBlock,
          cidrBlockAssociationSet: vpc.CidrBlockAssociationSet?.map(assoc => ({
            cidrBlock: assoc.CidrBlock,
            state: assoc.CidrBlockState?.State,
          })),
          ipv6CidrBlockAssociationSet: vpc.Ipv6CidrBlockAssociationSet?.map(assoc => ({
            ipv6CidrBlock: assoc.Ipv6CidrBlock,
            state: assoc.Ipv6CidrBlockState?.State,
          })),
          isDefault: vpc.IsDefault,
          dhcpOptionsId: vpc.DhcpOptionsId,
          instanceTenancy: vpc.InstanceTenancy,
        },
      });
    }
  }

  console.log('Scanned VPCs', { region, count: resources.length });
  return resources;
}

/**
 * Scan Subnets
 */
async function scanSubnets(
  ec2Client: EC2Client,
  region: string
): Promise<Resource[]> {
  const command = new DescribeSubnetsCommand({});
  const response = await ec2Client.send(command);

  const resources: Resource[] = [];

  if (response.Subnets) {
    for (const subnet of response.Subnets) {
      if (!subnet.SubnetId) continue;

      const tags = extractTags(subnet.Tags);
      const name = tags.Name || subnet.SubnetId;

      resources.push({
        resourceId: subnet.SubnetId,
        resourceName: name,
        resourceType: 'Subnet',
        region,
        state: subnet.State || 'unknown',
        tags,
        metadata: {
          vpcId: subnet.VpcId,
          cidrBlock: subnet.CidrBlock,
          availabilityZone: subnet.AvailabilityZone,
          availabilityZoneId: subnet.AvailabilityZoneId,
          availableIpAddressCount: subnet.AvailableIpAddressCount,
          mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
          defaultForAz: subnet.DefaultForAz,
          ipv6CidrBlockAssociationSet: subnet.Ipv6CidrBlockAssociationSet?.map(assoc => ({
            ipv6CidrBlock: assoc.Ipv6CidrBlock,
            state: assoc.Ipv6CidrBlockState?.State,
          })),
        },
      });
    }
  }

  console.log('Scanned Subnets', { region, count: resources.length });
  return resources;
}

/**
 * Extract tags from AWS tag array
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

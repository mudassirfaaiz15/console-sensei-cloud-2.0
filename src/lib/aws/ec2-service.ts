// AWS EC2 Service
// Fetches EC2 instances, EBS volumes, and Elastic IPs

import {
    DescribeInstancesCommand,
    DescribeVolumesCommand,
    DescribeAddressesCommand,
    type Instance,
    type Volume,
    type Address,
} from '@aws-sdk/client-ec2';
import { createEC2Client } from './client';
import { hasCredentials } from './credentials';

export interface EC2Instance {
    id: string;
    name: string;
    type: string;
    state: string;
    launchTime: string;
    publicIp?: string;
    privateIp?: string;
    region: string;
}

export interface EBSVolume {
    id: string;
    name: string;
    size: number;
    state: string;
    volumeType: string;
    attached: boolean;
    region: string;
}

export interface ElasticIP {
    allocationId: string;
    publicIp: string;
    associated: boolean;
    instanceId?: string;
    region: string;
}

export interface EC2Summary {
    instances: EC2Instance[];
    volumes: EBSVolume[];
    elasticIps: ElasticIP[];
    runningInstances: number;
    stoppedInstances: number;
    unattachedVolumes: number;
    unassociatedIps: number;
}

const AWS_REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-central-1',
    'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
];

/**
 * Get name tag from AWS tags
 */
function getNameTag(tags?: { Key?: string; Value?: string }[]): string {
    return tags?.find((t) => t.Key === 'Name')?.Value || 'Unnamed';
}

/**
 * Fetch EC2 instances from a region
 */
async function getInstancesForRegion(region: string): Promise<EC2Instance[]> {
    const client = createEC2Client(region);
    const instances: EC2Instance[] = [];

    try {
        const response = await client.send(new DescribeInstancesCommand({}));

        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                instances.push({
                    id: instance.InstanceId || '',
                    name: getNameTag(instance.Tags),
                    type: instance.InstanceType || '',
                    state: instance.State?.Name || 'unknown',
                    launchTime: instance.LaunchTime?.toISOString() || '',
                    publicIp: instance.PublicIpAddress,
                    privateIp: instance.PrivateIpAddress,
                    region,
                });
            }
        }
    } catch (error) {
        console.warn(`Failed to fetch instances from ${region}:`, error);
    }

    return instances;
}

/**
 * Fetch EBS volumes from a region
 */
async function getVolumesForRegion(region: string): Promise<EBSVolume[]> {
    const client = createEC2Client(region);
    const volumes: EBSVolume[] = [];

    try {
        const response = await client.send(new DescribeVolumesCommand({}));

        for (const volume of response.Volumes || []) {
            volumes.push({
                id: volume.VolumeId || '',
                name: getNameTag(volume.Tags),
                size: volume.Size || 0,
                state: volume.State || 'unknown',
                volumeType: volume.VolumeType || '',
                attached: (volume.Attachments?.length || 0) > 0,
                region,
            });
        }
    } catch (error) {
        console.warn(`Failed to fetch volumes from ${region}:`, error);
    }

    return volumes;
}

/**
 * Fetch Elastic IPs from a region
 */
async function getElasticIPsForRegion(region: string): Promise<ElasticIP[]> {
    const client = createEC2Client(region);
    const ips: ElasticIP[] = [];

    try {
        const response = await client.send(new DescribeAddressesCommand({}));

        for (const address of response.Addresses || []) {
            ips.push({
                allocationId: address.AllocationId || '',
                publicIp: address.PublicIp || '',
                associated: !!address.AssociationId,
                instanceId: address.InstanceId,
                region,
            });
        }
    } catch (error) {
        console.warn(`Failed to fetch EIPs from ${region}:`, error);
    }

    return ips;
}

/**
 * Fetch all EC2 resources across all regions
 */
export async function getEC2Summary(regions: string[] = AWS_REGIONS): Promise<EC2Summary> {
    if (!hasCredentials()) {
        throw new Error('AWS credentials not configured');
    }

    // Fetch from all regions in parallel
    const [instancesArrays, volumesArrays, ipsArrays] = await Promise.all([
        Promise.all(regions.map(getInstancesForRegion)),
        Promise.all(regions.map(getVolumesForRegion)),
        Promise.all(regions.map(getElasticIPsForRegion)),
    ]);

    const instances = instancesArrays.flat();
    const volumes = volumesArrays.flat();
    const elasticIps = ipsArrays.flat();

    return {
        instances,
        volumes,
        elasticIps,
        runningInstances: instances.filter((i) => i.state === 'running').length,
        stoppedInstances: instances.filter((i) => i.state === 'stopped').length,
        unattachedVolumes: volumes.filter((v) => !v.attached).length,
        unassociatedIps: elasticIps.filter((ip) => !ip.associated).length,
    };
}

/**
 * Quick scan of primary region only (faster)
 */
export async function getQuickEC2Summary(region?: string): Promise<EC2Summary> {
    const primaryRegion = region || 'us-east-1';
    return getEC2Summary([primaryRegion]);
}

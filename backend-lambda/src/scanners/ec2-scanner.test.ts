import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EC2Client } from '@aws-sdk/client-ec2';
import { scanEC2Resources } from './ec2-scanner';

describe('EC2 Scanner', () => {
  let mockEC2Client: EC2Client;

  beforeEach(() => {
    mockEC2Client = {
      send: vi.fn(),
    } as any;
  });

  describe('scanEC2Resources', () => {
    it('should scan EC2 instances successfully', async () => {
      // Mock EC2 responses
      vi.spyOn(mockEC2Client, 'send').mockImplementation((command: any) => {
        const commandName = command.constructor.name;
        
        if (commandName === 'DescribeInstancesCommand') {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-1234567890abcdef0',
                    InstanceType: 't2.micro',
                    State: { Name: 'running' },
                    LaunchTime: new Date('2024-01-01'),
                    PrivateIpAddress: '10.0.1.10',
                    PublicIpAddress: '54.123.45.67',
                    VpcId: 'vpc-12345',
                    SubnetId: 'subnet-12345',
                    Tags: [
                      { Key: 'Name', Value: 'WebServer' },
                      { Key: 'Environment', Value: 'Production' },
                    ],
                    Placement: { AvailabilityZone: 'us-east-1a' },
                    SecurityGroups: [
                      { GroupId: 'sg-12345', GroupName: 'web-sg' },
                    ],
                    Monitoring: { State: 'enabled' },
                    Architecture: 'x86_64',
                  },
                ],
              },
            ],
          });
        }
        
        if (commandName === 'DescribeVolumesCommand') {
          return Promise.resolve({
            Volumes: [
              {
                VolumeId: 'vol-1234567890abcdef0',
                Size: 100,
                VolumeType: 'gp3',
                State: 'in-use',
                Encrypted: true,
                AvailabilityZone: 'us-east-1a',
                CreateTime: new Date('2024-01-01'),
                Attachments: [
                  {
                    InstanceId: 'i-1234567890abcdef0',
                    Device: '/dev/sda1',
                    State: 'attached',
                    AttachTime: new Date('2024-01-01'),
                  },
                ],
                Tags: [{ Key: 'Name', Value: 'RootVolume' }],
              },
            ],
          });
        }
        
        if (commandName === 'DescribeAddressesCommand') {
          return Promise.resolve({
            Addresses: [
              {
                AllocationId: 'eipalloc-12345',
                PublicIp: '54.123.45.67',
                AssociationId: 'eipassoc-12345',
                InstanceId: 'i-1234567890abcdef0',
                Domain: 'vpc',
                Tags: [{ Key: 'Name', Value: 'WebServerEIP' }],
              },
            ],
          });
        }
        
        if (commandName === 'DescribeSecurityGroupsCommand') {
          return Promise.resolve({
            SecurityGroups: [
              {
                GroupId: 'sg-12345',
                GroupName: 'web-sg',
                Description: 'Web server security group',
                VpcId: 'vpc-12345',
                IpPermissions: [
                  {
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80,
                    IpRanges: [{ CidrIp: '0.0.0.0/0' }],
                  },
                  {
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443,
                    IpRanges: [{ CidrIp: '0.0.0.0/0' }],
                  },
                ],
                IpPermissionsEgress: [
                  {
                    IpProtocol: '-1',
                    IpRanges: [{ CidrIp: '0.0.0.0/0' }],
                  },
                ],
                Tags: [{ Key: 'Name', Value: 'WebSG' }],
              },
            ],
          });
        }
        
        if (commandName === 'DescribeVpcsCommand') {
          return Promise.resolve({
            Vpcs: [
              {
                VpcId: 'vpc-12345',
                CidrBlock: '10.0.0.0/16',
                State: 'available',
                IsDefault: false,
                Tags: [{ Key: 'Name', Value: 'MainVPC' }],
              },
            ],
          });
        }
        
        if (commandName === 'DescribeSubnetsCommand') {
          return Promise.resolve({
            Subnets: [
              {
                SubnetId: 'subnet-12345',
                VpcId: 'vpc-12345',
                CidrBlock: '10.0.1.0/24',
                AvailabilityZone: 'us-east-1a',
                State: 'available',
                AvailableIpAddressCount: 250,
                MapPublicIpOnLaunch: true,
                Tags: [{ Key: 'Name', Value: 'PublicSubnet1' }],
              },
            ],
          });
        }
        
        return Promise.resolve({});
      });

      const result = await scanEC2Resources(mockEC2Client, 'us-east-1');

      expect(result.resources).toHaveLength(6); // 1 instance + 1 volume + 1 EIP + 1 SG + 1 VPC + 1 subnet
      expect(result.errors).toHaveLength(0);

      // Verify EC2 instance
      const instance = result.resources.find(r => r.resourceType === 'EC2_Instance');
      expect(instance).toBeDefined();
      expect(instance?.resourceId).toBe('i-1234567890abcdef0');
      expect(instance?.resourceName).toBe('WebServer');
      expect(instance?.state).toBe('running');
      expect(instance?.tags.Environment).toBe('Production');
      expect(instance?.metadata.instanceType).toBe('t2.micro');

      // Verify EBS volume
      const volume = result.resources.find(r => r.resourceType === 'EBS_Volume');
      expect(volume).toBeDefined();
      expect(volume?.resourceId).toBe('vol-1234567890abcdef0');
      expect(volume?.metadata.encrypted).toBe(true);
      expect(volume?.metadata.size).toBe(100);

      // Verify Elastic IP
      const eip = result.resources.find(r => r.resourceType === 'Elastic_IP');
      expect(eip).toBeDefined();
      expect(eip?.state).toBe('associated');
      expect(eip?.metadata.publicIp).toBe('54.123.45.67');

      // Verify Security Group
      const sg = result.resources.find(r => r.resourceType === 'Security_Group');
      expect(sg).toBeDefined();
      expect(sg?.resourceId).toBe('sg-12345');
      expect(sg?.metadata.ingressRules).toHaveLength(2);

      // Verify VPC
      const vpc = result.resources.find(r => r.resourceType === 'VPC');
      expect(vpc).toBeDefined();
      expect(vpc?.resourceId).toBe('vpc-12345');
      expect(vpc?.metadata.cidrBlock).toBe('10.0.0.0/16');

      // Verify Subnet
      const subnet = result.resources.find(r => r.resourceType === 'Subnet');
      expect(subnet).toBeDefined();
      expect(subnet?.resourceId).toBe('subnet-12345');
      expect(subnet?.metadata.availableIpAddressCount).toBe(250);
    });

    it('should handle errors gracefully and continue scanning', async () => {
      vi.spyOn(mockEC2Client, 'send').mockImplementation((command: any) => {
        const commandName = command.constructor.name;
        
        // Fail EC2 instances scan
        if (commandName === 'DescribeInstancesCommand') {
          return Promise.reject(new Error('Access denied'));
        }
        
        // Succeed for volumes
        if (commandName === 'DescribeVolumesCommand') {
          return Promise.resolve({
            Volumes: [
              {
                VolumeId: 'vol-12345',
                Size: 50,
                VolumeType: 'gp2',
                State: 'available',
                Encrypted: false,
                AvailabilityZone: 'us-east-1a',
                CreateTime: new Date('2024-01-01'),
                Tags: [],
              },
            ],
          });
        }
        
        // Return empty for others
        return Promise.resolve({});
      });

      const result = await scanEC2Resources(mockEC2Client, 'us-east-1');

      // Should have 1 volume resource
      expect(result.resources.length).toBeGreaterThan(0);
      
      // Should have 1 error for EC2 instances
      expect(result.errors.length).toBeGreaterThan(0);
      const ec2Error = result.errors.find(e => e.service === 'EC2_Instances');
      expect(ec2Error).toBeDefined();
      expect(ec2Error?.message).toContain('Access denied');
    });

    it('should handle empty responses', async () => {
      vi.spyOn(mockEC2Client, 'send').mockResolvedValue({});

      const result = await scanEC2Resources(mockEC2Client, 'us-east-1');

      expect(result.resources).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should extract tags correctly', async () => {
      vi.spyOn(mockEC2Client, 'send').mockImplementation((command: any) => {
        const commandName = command.constructor.name;
        
        if (commandName === 'DescribeInstancesCommand') {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-test',
                    State: { Name: 'running' },
                    Tags: [
                      { Key: 'Name', Value: 'TestServer' },
                      { Key: 'Environment', Value: 'Dev' },
                      { Key: 'Owner', Value: 'TeamA' },
                      { Key: 'Project', Value: 'WebApp' },
                    ],
                  },
                ],
              },
            ],
          });
        }
        
        return Promise.resolve({});
      });

      const result = await scanEC2Resources(mockEC2Client, 'us-east-1');

      const instance = result.resources.find(r => r.resourceType === 'EC2_Instance');
      expect(instance?.tags).toEqual({
        Name: 'TestServer',
        Environment: 'Dev',
        Owner: 'TeamA',
        Project: 'WebApp',
      });
    });
  });
});

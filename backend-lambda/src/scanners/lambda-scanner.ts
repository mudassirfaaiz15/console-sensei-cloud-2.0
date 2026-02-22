import {
  ListFunctionsCommand,
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  ListServicesCommand,
  ListTasksCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ECSClient,
} from '@aws-sdk/client-ecs';
import {
  ListClustersCommand,
  DescribeClusterCommand,
  EKSClient,
} from '@aws-sdk/client-eks';
import { Resource, ScanError } from '../types';

/**
 * Lambda and Compute Resource Scanner
 * 
 * Requirements:
 * - 3.5: Scan Lambda functions, ECS tasks/services, and EKS clusters
 */

export interface LambdaScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all Lambda and compute resources in a region
 * 
 * @param lambdaClient - Lambda client for the region
 * @param ecsClient - ECS client for the region
 * @param eksClient - EKS client for the region
 * @param region - AWS region
 * @returns Compute resources and errors
 */
export async function scanLambdaResources(
  lambdaClient: LambdaClient,
  ecsClient: ECSClient,
  eksClient: EKSClient,
  region: string
): Promise<LambdaScanResult> {
  console.log('Scanning Lambda and compute resources', { region });

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  // Scan Lambda functions
  try {
    const functions = await scanLambdaFunctions(lambdaClient, region);
    resources.push(...functions);
  } catch (error) {
    errors.push(createScanError('Lambda_Functions', region, error));
  }

  // Scan ECS services
  try {
    const ecsResources = await scanECSResources(ecsClient, region);
    resources.push(...ecsResources);
  } catch (error) {
    errors.push(createScanError('ECS_Services', region, error));
  }

  // Scan EKS clusters
  try {
    const eksClusters = await scanEKSClusters(eksClient, region);
    resources.push(...eksClusters);
  } catch (error) {
    errors.push(createScanError('EKS_Clusters', region, error));
  }

  console.log('Lambda and compute scan completed', {
    region,
    resourceCount: resources.length,
    errorCount: errors.length,
  });

  return { resources, errors };
}

/**
 * Scan Lambda functions with metadata
 */
async function scanLambdaFunctions(
  lambdaClient: LambdaClient,
  region: string
): Promise<Resource[]> {
  const command = new ListFunctionsCommand({});
  const response = await lambdaClient.send(command);

  const resources: Resource[] = [];

  if (response.Functions) {
    for (const func of response.Functions) {
      if (!func.FunctionName) continue;

      // Get detailed function configuration
      let tags: Record<string, string> = {};
      try {
        const getCommand = new GetFunctionCommand({ FunctionName: func.FunctionName });
        const getResponse = await lambdaClient.send(getCommand);
        tags = getResponse.Tags || {};
      } catch (error) {
        console.warn('Failed to get Lambda function tags', { functionName: func.FunctionName });
      }

      const name = tags.Name || func.FunctionName;

      resources.push({
        resourceId: func.FunctionArn || func.FunctionName,
        resourceName: name,
        resourceType: 'Lambda_Function',
        region,
        state: func.State || 'unknown',
        creationDate: func.LastModified,
        tags,
        metadata: {
          runtime: func.Runtime,
          handler: func.Handler,
          codeSize: func.CodeSize,
          description: func.Description,
          timeout: func.Timeout,
          memorySize: func.MemorySize,
          lastModified: func.LastModified,
          version: func.Version,
          role: func.Role,
          environment: func.Environment?.Variables,
          vpcConfig: func.VpcConfig ? {
            subnetIds: func.VpcConfig.SubnetIds,
            securityGroupIds: func.VpcConfig.SecurityGroupIds,
            vpcId: func.VpcConfig.VpcId,
          } : undefined,
          layers: func.Layers?.map(l => ({
            arn: l.Arn,
            codeSize: l.CodeSize,
          })),
          architectures: func.Architectures,
          packageType: func.PackageType,
        },
      });
    }
  }

  console.log('Scanned Lambda functions', { region, count: resources.length });
  return resources;
}

/**
 * Scan ECS services and tasks
 */
async function scanECSResources(
  ecsClient: ECSClient,
  region: string
): Promise<Resource[]> {
  const resources: Resource[] = [];

  // List ECS clusters first
  const listClustersCommand = new ListServicesCommand({});
  
  try {
    const servicesResponse = await ecsClient.send(listClustersCommand);
    
    if (servicesResponse.serviceArns && servicesResponse.serviceArns.length > 0) {
      // Describe services to get details
      const describeCommand = new DescribeServicesCommand({
        services: servicesResponse.serviceArns,
      });
      
      const describeResponse = await ecsClient.send(describeCommand);
      
      if (describeResponse.services) {
        for (const service of describeResponse.services) {
          if (!service.serviceName) continue;

          resources.push({
            resourceId: service.serviceArn || service.serviceName,
            resourceName: service.serviceName,
            resourceType: 'ECS_Task',
            region,
            state: service.status || 'unknown',
            creationDate: service.createdAt?.toISOString(),
            tags: extractTags(service.tags),
            metadata: {
              clusterArn: service.clusterArn,
              taskDefinition: service.taskDefinition,
              desiredCount: service.desiredCount,
              runningCount: service.runningCount,
              pendingCount: service.pendingCount,
              launchType: service.launchType,
              platformVersion: service.platformVersion,
              loadBalancers: service.loadBalancers?.map(lb => ({
                targetGroupArn: lb.targetGroupArn,
                containerName: lb.containerName,
                containerPort: lb.containerPort,
              })),
              networkConfiguration: service.networkConfiguration,
              healthCheckGracePeriodSeconds: service.healthCheckGracePeriodSeconds,
              schedulingStrategy: service.schedulingStrategy,
            },
          });
        }
      }
    }
  } catch (error) {
    console.warn('Failed to scan ECS services', { region, error });
  }

  console.log('Scanned ECS resources', { region, count: resources.length });
  return resources;
}

/**
 * Scan EKS clusters
 */
async function scanEKSClusters(
  eksClient: EKSClient,
  region: string
): Promise<Resource[]> {
  const listCommand = new ListClustersCommand({});
  const listResponse = await eksClient.send(listCommand);

  const resources: Resource[] = [];

  if (listResponse.clusters) {
    for (const clusterName of listResponse.clusters) {
      try {
        const describeCommand = new DescribeClusterCommand({ name: clusterName });
        const describeResponse = await eksClient.send(describeCommand);
        const cluster = describeResponse.cluster;

        if (!cluster) continue;

        resources.push({
          resourceId: cluster.arn || clusterName,
          resourceName: clusterName,
          resourceType: 'EKS_Cluster',
          region,
          state: cluster.status || 'unknown',
          creationDate: cluster.createdAt?.toISOString(),
          tags: cluster.tags || {},
          metadata: {
            version: cluster.version,
            endpoint: cluster.endpoint,
            roleArn: cluster.roleArn,
            resourcesVpcConfig: cluster.resourcesVpcConfig ? {
              subnetIds: cluster.resourcesVpcConfig.subnetIds,
              securityGroupIds: cluster.resourcesVpcConfig.securityGroupIds,
              vpcId: cluster.resourcesVpcConfig.vpcId,
              endpointPublicAccess: cluster.resourcesVpcConfig.endpointPublicAccess,
              endpointPrivateAccess: cluster.resourcesVpcConfig.endpointPrivateAccess,
            } : undefined,
            platformVersion: cluster.platformVersion,
            encryptionConfig: cluster.encryptionConfig,
            logging: cluster.logging,
          },
        });
      } catch (error) {
        console.warn('Failed to describe EKS cluster', { clusterName, error });
      }
    }
  }

  console.log('Scanned EKS clusters', { region, count: resources.length });
  return resources;
}

/**
 * Extract tags from AWS tag array
 */
function extractTags(tags?: Array<{ key?: string; value?: string }>): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (tags) {
    for (const tag of tags) {
      if (tag.key && tag.value !== undefined) {
        result[tag.key] = tag.value;
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

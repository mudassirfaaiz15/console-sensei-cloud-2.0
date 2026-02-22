import {
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  ListTablesCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { Resource, ScanError } from '../types';

/**
 * RDS and Database Resource Scanner
 * 
 * Requirements:
 * - 3.4: Scan RDS instances, Aurora clusters, and DynamoDB tables
 */

export interface RDSScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all RDS and database resources in a region
 * 
 * @param rdsClient - RDS client for the region
 * @param dynamoClient - DynamoDB client for the region
 * @param region - AWS region
 * @returns Database resources and errors
 */
export async function scanRDSResources(
  rdsClient: RDSClient,
  dynamoClient: DynamoDBClient,
  region: string
): Promise<RDSScanResult> {
  console.log('Scanning RDS and database resources', { region });

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  // Scan RDS instances
  try {
    const instances = await scanRDSInstances(rdsClient, region);
    resources.push(...instances);
  } catch (error) {
    errors.push(createScanError('RDS_Instances', region, error));
  }

  // Scan Aurora clusters
  try {
    const clusters = await scanAuroraClusters(rdsClient, region);
    resources.push(...clusters);
  } catch (error) {
    errors.push(createScanError('Aurora_Clusters', region, error));
  }

  // Scan DynamoDB tables
  try {
    const tables = await scanDynamoDBTables(dynamoClient, region);
    resources.push(...tables);
  } catch (error) {
    errors.push(createScanError('DynamoDB_Tables', region, error));
  }

  console.log('RDS scan completed', {
    region,
    resourceCount: resources.length,
    errorCount: errors.length,
  });

  return { resources, errors };
}

/**
 * Scan RDS instances with metadata
 */
async function scanRDSInstances(
  rdsClient: RDSClient,
  region: string
): Promise<Resource[]> {
  const command = new DescribeDBInstancesCommand({});
  const response = await rdsClient.send(command);

  const resources: Resource[] = [];

  if (response.DBInstances) {
    for (const instance of response.DBInstances) {
      if (!instance.DBInstanceIdentifier) continue;

      const tags = extractTags(instance.TagList);
      const name = tags.Name || instance.DBInstanceIdentifier;

      resources.push({
        resourceId: instance.DBInstanceArn || instance.DBInstanceIdentifier,
        resourceName: name,
        resourceType: 'RDS_Instance',
        region,
        state: instance.DBInstanceStatus || 'unknown',
        creationDate: instance.InstanceCreateTime?.toISOString(),
        tags,
        metadata: {
          engine: instance.Engine,
          engineVersion: instance.EngineVersion,
          dbInstanceClass: instance.DBInstanceClass,
          allocatedStorage: instance.AllocatedStorage,
          storageType: instance.StorageType,
          storageEncrypted: instance.StorageEncrypted,
          multiAZ: instance.MultiAZ,
          publiclyAccessible: instance.PubliclyAccessible,
          endpoint: instance.Endpoint ? {
            address: instance.Endpoint.Address,
            port: instance.Endpoint.Port,
          } : undefined,
          vpcId: instance.DBSubnetGroup?.VpcId,
          availabilityZone: instance.AvailabilityZone,
          backupRetentionPeriod: instance.BackupRetentionPeriod,
          preferredBackupWindow: instance.PreferredBackupWindow,
          preferredMaintenanceWindow: instance.PreferredMaintenanceWindow,
          latestRestorableTime: instance.LatestRestorableTime?.toISOString(),
          autoMinorVersionUpgrade: instance.AutoMinorVersionUpgrade,
          iops: instance.Iops,
          performanceInsightsEnabled: instance.PerformanceInsightsEnabled,
        },
      });
    }
  }

  console.log('Scanned RDS instances', { region, count: resources.length });
  return resources;
}

/**
 * Scan Aurora clusters with metadata
 */
async function scanAuroraClusters(
  rdsClient: RDSClient,
  region: string
): Promise<Resource[]> {
  const command = new DescribeDBClustersCommand({});
  const response = await rdsClient.send(command);

  const resources: Resource[] = [];

  if (response.DBClusters) {
    for (const cluster of response.DBClusters) {
      if (!cluster.DBClusterIdentifier) continue;

      const tags = extractTags(cluster.TagList);
      const name = tags.Name || cluster.DBClusterIdentifier;

      resources.push({
        resourceId: cluster.DBClusterArn || cluster.DBClusterIdentifier,
        resourceName: name,
        resourceType: 'RDS_Instance', // Using RDS_Instance type for clusters too
        region,
        state: cluster.Status || 'unknown',
        creationDate: cluster.ClusterCreateTime?.toISOString(),
        tags,
        metadata: {
          engine: cluster.Engine,
          engineVersion: cluster.EngineVersion,
          engineMode: cluster.EngineMode,
          allocatedStorage: cluster.AllocatedStorage,
          storageEncrypted: cluster.StorageEncrypted,
          multiAZ: cluster.MultiAZ,
          endpoint: cluster.Endpoint,
          readerEndpoint: cluster.ReaderEndpoint,
          port: cluster.Port,
          availabilityZones: cluster.AvailabilityZones,
          backupRetentionPeriod: cluster.BackupRetentionPeriod,
          preferredBackupWindow: cluster.PreferredBackupWindow,
          preferredMaintenanceWindow: cluster.PreferredMaintenanceWindow,
          latestRestorableTime: cluster.LatestRestorableTime?.toISOString(),
          clusterMembers: cluster.DBClusterMembers?.map(m => ({
            instanceIdentifier: m.DBInstanceIdentifier,
            isClusterWriter: m.IsClusterWriter,
          })),
          isCluster: true,
        },
      });
    }
  }

  console.log('Scanned Aurora clusters', { region, count: resources.length });
  return resources;
}

/**
 * Scan DynamoDB tables with metadata
 */
async function scanDynamoDBTables(
  dynamoClient: DynamoDBClient,
  region: string
): Promise<Resource[]> {
  const listCommand = new ListTablesCommand({});
  const listResponse = await dynamoClient.send(listCommand);

  const resources: Resource[] = [];

  if (listResponse.TableNames) {
    for (const tableName of listResponse.TableNames) {
      try {
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const describeResponse = await dynamoClient.send(describeCommand);
        const table = describeResponse.Table;

        if (!table) continue;

        resources.push({
          resourceId: table.TableArn || tableName,
          resourceName: tableName,
          resourceType: 'RDS_Instance', // Using RDS_Instance type for DynamoDB too
          region,
          state: table.TableStatus || 'unknown',
          creationDate: table.CreationDateTime?.toISOString(),
          tags: {}, // DynamoDB tags require separate API call
          metadata: {
            itemCount: table.ItemCount,
            tableSizeBytes: table.TableSizeBytes,
            billingMode: table.BillingModeSummary?.BillingMode,
            provisionedThroughput: table.ProvisionedThroughput ? {
              readCapacityUnits: table.ProvisionedThroughput.ReadCapacityUnits,
              writeCapacityUnits: table.ProvisionedThroughput.WriteCapacityUnits,
            } : undefined,
            keySchema: table.KeySchema?.map(k => ({
              attributeName: k.AttributeName,
              keyType: k.KeyType,
            })),
            globalSecondaryIndexes: table.GlobalSecondaryIndexes?.map(gsi => ({
              indexName: gsi.IndexName,
              keySchema: gsi.KeySchema,
              projection: gsi.Projection?.ProjectionType,
            })),
            streamEnabled: table.StreamSpecification?.StreamEnabled,
            sseDescription: table.SSEDescription ? {
              status: table.SSEDescription.Status,
              sseType: table.SSEDescription.SSEType,
            } : undefined,
            isDynamoDB: true,
          },
        });
      } catch (error) {
        console.warn('Failed to describe DynamoDB table', { tableName, error });
      }
    }
  }

  console.log('Scanned DynamoDB tables', { region, count: resources.length });
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

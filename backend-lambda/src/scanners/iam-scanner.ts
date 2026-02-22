import {
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
  GetUserCommand,
  ListMFADevicesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import { Resource, ScanError } from '../types';

/**
 * IAM Resource Scanner
 * 
 * Requirements:
 * - 3.7: Scan IAM users with MFA status, roles, policies, and overly permissive policies
 * 
 * Note: IAM is a global service, so region is set to 'global'
 */

export interface IAMScanResult {
  resources: Resource[];
  errors: ScanError[];
}

/**
 * Scan all IAM resources (global service)
 * 
 * @param iamClient - IAM client
 * @returns IAM resources and errors
 */
export async function scanIAMResources(
  iamClient: IAMClient
): Promise<IAMScanResult> {
  console.log('Scanning IAM resources (global service)');

  const resources: Resource[] = [];
  const errors: ScanError[] = [];

  // Scan IAM users
  try {
    const users = await scanIAMUsers(iamClient);
    resources.push(...users);
  } catch (error) {
    errors.push(createScanError('IAM_Users', 'global', error));
  }

  // Scan IAM roles
  try {
    const roles = await scanIAMRoles(iamClient);
    resources.push(...roles);
  } catch (error) {
    errors.push(createScanError('IAM_Roles', 'global', error));
  }

  // Scan IAM policies
  try {
    const policies = await scanIAMPolicies(iamClient);
    resources.push(...policies);
  } catch (error) {
    errors.push(createScanError('IAM_Policies', 'global', error));
  }

  console.log('IAM scan completed', {
    resourceCount: resources.length,
    errorCount: errors.length,
  });

  return { resources, errors };
}

/**
 * Scan IAM users with MFA status
 */
async function scanIAMUsers(
  iamClient: IAMClient
): Promise<Resource[]> {
  const command = new ListUsersCommand({});
  const response = await iamClient.send(command);

  const resources: Resource[] = [];

  if (response.Users) {
    for (const user of response.Users) {
      if (!user.UserName) continue;

      // Check MFA status
      let mfaEnabled = false;
      try {
        const mfaCommand = new ListMFADevicesCommand({ UserName: user.UserName });
        const mfaResponse = await iamClient.send(mfaCommand);
        mfaEnabled = (mfaResponse.MFADevices?.length || 0) > 0;
      } catch (error) {
        console.warn('Failed to check MFA status', { userName: user.UserName });
      }

      // Get user details
      let passwordLastUsed: string | undefined;
      try {
        const getUserCommand = new GetUserCommand({ UserName: user.UserName });
        const getUserResponse = await iamClient.send(getUserCommand);
        passwordLastUsed = getUserResponse.User?.PasswordLastUsed?.toISOString();
      } catch (error) {
        console.warn('Failed to get user details', { userName: user.UserName });
      }

      resources.push({
        resourceId: user.Arn || user.UserName,
        resourceName: user.UserName,
        resourceType: 'IAM_User',
        region: 'global',
        state: 'active',
        creationDate: user.CreateDate?.toISOString(),
        tags: extractTags(user.Tags),
        metadata: {
          userId: user.UserId,
          path: user.Path,
          mfaEnabled,
          passwordLastUsed,
          permissionsBoundary: user.PermissionsBoundary ? {
            type: user.PermissionsBoundary.PermissionsBoundaryType,
            arn: user.PermissionsBoundary.PermissionsBoundaryArn,
          } : undefined,
        },
      });
    }
  }

  console.log('Scanned IAM users', { count: resources.length });
  return resources;
}

/**
 * Scan IAM roles
 */
async function scanIAMRoles(
  iamClient: IAMClient
): Promise<Resource[]> {
  const command = new ListRolesCommand({});
  const response = await iamClient.send(command);

  const resources: Resource[] = [];

  if (response.Roles) {
    for (const role of response.Roles) {
      if (!role.RoleName) continue;

      resources.push({
        resourceId: role.Arn || role.RoleName,
        resourceName: role.RoleName,
        resourceType: 'IAM_Role',
        region: 'global',
        state: 'active',
        creationDate: role.CreateDate?.toISOString(),
        tags: extractTags(role.Tags),
        metadata: {
          roleId: role.RoleId,
          path: role.Path,
          description: role.Description,
          maxSessionDuration: role.MaxSessionDuration,
          assumeRolePolicyDocument: role.AssumeRolePolicyDocument,
          permissionsBoundary: role.PermissionsBoundary ? {
            type: role.PermissionsBoundary.PermissionsBoundaryType,
            arn: role.PermissionsBoundary.PermissionsBoundaryArn,
          } : undefined,
          lastUsed: role.RoleLastUsed ? {
            lastUsedDate: role.RoleLastUsed.LastUsedDate?.toISOString(),
            region: role.RoleLastUsed.Region,
          } : undefined,
        },
      });
    }
  }

  console.log('Scanned IAM roles', { count: resources.length });
  return resources;
}

/**
 * Scan IAM policies (customer managed only)
 */
async function scanIAMPolicies(
  iamClient: IAMClient
): Promise<Resource[]> {
  // Only scan customer-managed policies (not AWS managed)
  const command = new ListPoliciesCommand({
    Scope: 'Local',
    MaxItems: 100,
  });
  const response = await iamClient.send(command);

  const resources: Resource[] = [];

  if (response.Policies) {
    for (const policy of response.Policies) {
      if (!policy.PolicyName) continue;

      // Get policy document to check for overly permissive statements
      let policyDocument: any = undefined;
      let isOverlyPermissive = false;

      try {
        if (policy.Arn && policy.DefaultVersionId) {
          const getPolicyCommand = new GetPolicyCommand({ PolicyArn: policy.Arn });
          await iamClient.send(getPolicyCommand);

          const getVersionCommand = new GetPolicyVersionCommand({
            PolicyArn: policy.Arn,
            VersionId: policy.DefaultVersionId,
          });
          const versionResponse = await iamClient.send(getVersionCommand);
          
          if (versionResponse.PolicyVersion?.Document) {
            const docString = decodeURIComponent(versionResponse.PolicyVersion.Document);
            policyDocument = JSON.parse(docString);
            
            // Check for overly permissive policies
            isOverlyPermissive = checkOverlyPermissive(policyDocument);
          }
        }
      } catch (error) {
        console.warn('Failed to get policy document', { policyName: policy.PolicyName });
      }

      resources.push({
        resourceId: policy.Arn || policy.PolicyName,
        resourceName: policy.PolicyName,
        resourceType: 'IAM_Role', // Using IAM_Role type for policies
        region: 'global',
        state: 'active',
        creationDate: policy.CreateDate?.toISOString(),
        tags: extractTags(policy.Tags),
        metadata: {
          policyId: policy.PolicyId,
          path: policy.Path,
          description: policy.Description,
          attachmentCount: policy.AttachmentCount,
          permissionsBoundaryUsageCount: policy.PermissionsBoundaryUsageCount,
          isAttachable: policy.IsAttachable,
          defaultVersionId: policy.DefaultVersionId,
          policyDocument,
          isOverlyPermissive,
          updateDate: policy.UpdateDate?.toISOString(),
          isPolicy: true,
        },
      });
    }
  }

  console.log('Scanned IAM policies', { count: resources.length });
  return resources;
}

/**
 * Check if a policy is overly permissive
 * Returns true if policy has Action: "*" with Resource: "*"
 */
function checkOverlyPermissive(policyDocument: any): boolean {
  if (!policyDocument || !policyDocument.Statement) {
    return false;
  }

  const statements = Array.isArray(policyDocument.Statement)
    ? policyDocument.Statement
    : [policyDocument.Statement];

  for (const statement of statements) {
    if (statement.Effect !== 'Allow') continue;

    const actions = Array.isArray(statement.Action)
      ? statement.Action
      : [statement.Action];
    
    const resources = Array.isArray(statement.Resource)
      ? statement.Resource
      : [statement.Resource];

    // Check for wildcard action and resource
    const hasWildcardAction = actions.includes('*');
    const hasWildcardResource = resources.includes('*');

    if (hasWildcardAction && hasWildcardResource) {
      return true;
    }
  }

  return false;
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

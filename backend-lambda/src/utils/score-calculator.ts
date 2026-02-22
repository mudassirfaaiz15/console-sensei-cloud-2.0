import { ScanResult, ScoreResult, ScoreBreakdown, ScoreComponent, Issue } from '../types';

/**
 * Score calculation framework for hygiene scoring
 * 
 * Requirements:
 * - 4.1: Calculate hygiene score from 0 to 100
 * - 4.2: Weight security factors at 40%
 * - 4.8: Weight cost efficiency factors at 30%
 * - 4.13: Weight best practices factors at 30%
 * - 4.18: Provide detailed breakdown of score components
 */

// Score weights
const SECURITY_WEIGHT = 40;
const COST_EFFICIENCY_WEIGHT = 30;
const BEST_PRACTICES_WEIGHT = 30;

/**
 * Calculate overall hygiene score from scan results
 * 
 * @param scanResult - The scan result to analyze
 * @returns Complete score result with breakdown
 */
export function calculateHygieneScore(scanResult: ScanResult): ScoreResult {
  console.log('Calculating hygiene score', {
    scanId: scanResult.scanId,
    userId: scanResult.userId,
    resourceCount: scanResult.resources.length,
  });

  // Calculate each component
  const security = calculateSecurityScore(scanResult);
  const costEfficiency = calculateCostEfficiencyScore(scanResult);
  const bestPractices = calculateBestPracticesScore(scanResult);

  // Calculate overall score
  const overallScore = security.score + costEfficiency.score + bestPractices.score;

  const breakdown: ScoreBreakdown = {
    security,
    costEfficiency,
    bestPractices,
  };

  const scoreResult: ScoreResult = {
    scanId: scanResult.scanId,
    userId: scanResult.userId,
    timestamp: new Date().toISOString(),
    overallScore: Math.round(overallScore),
    breakdown,
  };

  console.log('Hygiene score calculated', {
    scanId: scanResult.scanId,
    overallScore: scoreResult.overallScore,
    security: security.score,
    costEfficiency: costEfficiency.score,
    bestPractices: bestPractices.score,
  });

  return scoreResult;
}

/**
 * Calculate security score component (40% of total)
 * 
 * Requirements:
 * - 4.2: Weight security factors at 40%
 * - 4.3: Deduct for public S3 buckets without encryption
 * - 4.4: Deduct for security groups allowing 0.0.0.0/0 on sensitive ports
 * - 4.5: Deduct for unencrypted EBS volumes
 * - 4.6: Deduct for IAM users without MFA
 * - 4.7: Deduct for overly permissive IAM policies
 * 
 * @param scanResult - The scan result to analyze
 * @returns Security score component
 */
export function calculateSecurityScore(scanResult: ScanResult): ScoreComponent {
  const issues: Issue[] = [];
  let score = SECURITY_WEIGHT;

  // Sensitive ports that should not be open to 0.0.0.0/0
  const SENSITIVE_PORTS = [22, 3389, 3306, 5432];

  // Check for public S3 buckets without encryption (Requirement 4.3)
  const s3Buckets = scanResult.resources.filter(r => r.resourceType === 'S3_Bucket');
  for (const bucket of s3Buckets) {
    const isPublic = bucket.metadata.publicAccess === true || bucket.metadata.isPublic === true;
    const isEncrypted = bucket.metadata.encrypted === true || bucket.metadata.encryption === true;
    
    if (isPublic && !isEncrypted) {
      const deduction = 5;
      score -= deduction;
      issues.push({
        type: 'public_s3_bucket_unencrypted',
        severity: 'high',
        resourceId: bucket.resourceId,
        resourceName: bucket.resourceName,
        description: `S3 bucket "${bucket.resourceName}" is publicly accessible and not encrypted`,
        deduction,
        fixGuide: {
          title: 'Secure S3 Bucket',
          steps: [
            'Enable encryption on the S3 bucket',
            'Review and restrict public access settings',
            'Consider using bucket policies to limit access'
          ],
          cliCommands: [
            `aws s3api put-bucket-encryption --bucket ${bucket.resourceName} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'`,
            `aws s3api put-public-access-block --bucket ${bucket.resourceName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html'
        }
      });
    }
  }

  // Check for security groups with 0.0.0.0/0 on sensitive ports (Requirement 4.4)
  const securityGroups = scanResult.resources.filter(r => r.resourceType === 'Security_Group');
  for (const sg of securityGroups) {
    const ingressRules = sg.metadata.ingressRules || [];
    
    for (const rule of ingressRules) {
      const cidr = rule.cidr || rule.cidrIp || rule.CidrIp;
      const fromPort = rule.fromPort || rule.FromPort;
      const toPort = rule.toPort || rule.ToPort;
      
      if (cidr === '0.0.0.0/0') {
        // Check if any sensitive port is in the range
        for (const sensitivePort of SENSITIVE_PORTS) {
          if (fromPort <= sensitivePort && toPort >= sensitivePort) {
            const deduction = 4;
            score -= deduction;
            issues.push({
              type: 'open_security_group',
              severity: 'critical',
              resourceId: sg.resourceId,
              resourceName: sg.resourceName,
              description: `Security group "${sg.resourceName}" allows access from 0.0.0.0/0 on port ${sensitivePort}`,
              deduction,
              fixGuide: {
                title: 'Restrict Security Group Access',
                steps: [
                  'Remove the rule allowing 0.0.0.0/0 access',
                  'Add specific IP ranges that need access',
                  'Consider using AWS Systems Manager Session Manager instead of SSH'
                ],
                cliCommands: [
                  `aws ec2 revoke-security-group-ingress --group-id ${sg.resourceId} --protocol tcp --port ${sensitivePort} --cidr 0.0.0.0/0`,
                  `aws ec2 authorize-security-group-ingress --group-id ${sg.resourceId} --protocol tcp --port ${sensitivePort} --cidr YOUR_IP/32`
                ],
                documentationUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html'
              }
            });
            break; // Only report once per security group
          }
        }
      }
    }
  }

  // Check for unencrypted EBS volumes (Requirement 4.5)
  const ebsVolumes = scanResult.resources.filter(r => r.resourceType === 'EBS_Volume');
  for (const volume of ebsVolumes) {
    const isEncrypted = volume.metadata.encrypted === true || volume.metadata.Encrypted === true;
    
    if (!isEncrypted) {
      const deduction = 3;
      score -= deduction;
      issues.push({
        type: 'unencrypted_ebs_volume',
        severity: 'medium',
        resourceId: volume.resourceId,
        resourceName: volume.resourceName,
        description: `EBS volume "${volume.resourceName}" is not encrypted`,
        deduction,
        fixGuide: {
          title: 'Enable EBS Encryption',
          steps: [
            'Create a snapshot of the unencrypted volume',
            'Create a new encrypted volume from the snapshot',
            'Replace the unencrypted volume with the encrypted one',
            'Enable EBS encryption by default for the region'
          ],
          cliCommands: [
            `aws ec2 create-snapshot --volume-id ${volume.resourceId} --description "Snapshot for encryption"`,
            `aws ec2 enable-ebs-encryption-by-default --region ${volume.region}`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html'
        }
      });
    }
  }

  // Check for IAM users without MFA (Requirement 4.6)
  const iamUsers = scanResult.resources.filter(r => r.resourceType === 'IAM_User');
  for (const user of iamUsers) {
    const hasMFA = user.metadata.mfaEnabled === true || user.metadata.MFAEnabled === true;
    
    if (!hasMFA) {
      const deduction = 3;
      score -= deduction;
      issues.push({
        type: 'iam_user_no_mfa',
        severity: 'high',
        resourceId: user.resourceId,
        resourceName: user.resourceName,
        description: `IAM user "${user.resourceName}" does not have MFA enabled`,
        deduction,
        fixGuide: {
          title: 'Enable MFA for IAM User',
          steps: [
            'Sign in to the AWS Management Console',
            'Navigate to IAM > Users',
            'Select the user and go to Security credentials tab',
            'Click "Manage" next to "Assigned MFA device"',
            'Follow the wizard to set up a virtual or hardware MFA device'
          ],
          cliCommands: [
            `aws iam enable-mfa-device --user-name ${user.resourceName} --serial-number arn:aws:iam::ACCOUNT_ID:mfa/${user.resourceName} --authentication-code-1 CODE1 --authentication-code-2 CODE2`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html'
        }
      });
    }
  }

  // Check for overly permissive IAM policies (Requirement 4.7)
  const iamRoles = scanResult.resources.filter(r => r.resourceType === 'IAM_Role');
  const allIAMResources = [...iamUsers, ...iamRoles];
  
  for (const resource of allIAMResources) {
    const policies = resource.metadata.policies || [];
    
    for (const policy of policies) {
      const policyDocument = policy.document || policy.PolicyDocument;
      if (!policyDocument) continue;
      
      const statements = policyDocument.Statement || [];
      
      for (const statement of statements) {
        const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
        const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
        const effect = statement.Effect;
        
        // Check for Action: "*" and Resource: "*"
        if (effect === 'Allow' && actions.includes('*') && resources.includes('*')) {
          const deduction = 5;
          score -= deduction;
          issues.push({
            type: 'overly_permissive_iam_policy',
            severity: 'critical',
            resourceId: resource.resourceId,
            resourceName: resource.resourceName,
            description: `${resource.resourceType === 'IAM_User' ? 'IAM user' : 'IAM role'} "${resource.resourceName}" has overly permissive policy with Action: "*" and Resource: "*"`,
            deduction,
            fixGuide: {
              title: 'Apply Least Privilege Principle',
              steps: [
                'Review the policy and identify the actual permissions needed',
                'Replace wildcard actions with specific actions',
                'Replace wildcard resources with specific resource ARNs',
                'Test the new policy before applying to production',
                'Consider using AWS managed policies when appropriate'
              ],
              cliCommands: [
                `aws iam get-${resource.resourceType === 'IAM_User' ? 'user' : 'role'}-policy --${resource.resourceType === 'IAM_User' ? 'user' : 'role'}-name ${resource.resourceName} --policy-name POLICY_NAME`
              ],
              documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege'
            }
          });
          break; // Only report once per resource
        }
      }
    }
  }

  return {
    score: Math.max(0, score),
    maxScore: SECURITY_WEIGHT,
    issues,
  };
}

/**
 * Calculate cost efficiency score component (30% of total)
 * 
 * Requirements:
 * - 4.8: Weight cost efficiency factors at 30%
 * - 4.9: Deduct for stopped EC2 instances older than 7 days
 * - 4.10: Deduct for unattached EBS volumes
 * - 4.11: Deduct for oversized instances with low CPU utilization
 * - 4.12: Deduct for unassociated Elastic IPs
 * 
 * @param scanResult - The scan result to analyze
 * @returns Cost efficiency score component
 */
export function calculateCostEfficiencyScore(scanResult: ScanResult): ScoreComponent {
  const issues: Issue[] = [];
  let score = COST_EFFICIENCY_WEIGHT;

  const now = new Date();

  // Check for stopped EC2 instances older than 7 days (Requirement 4.9)
  const ec2Instances = scanResult.resources.filter(r => r.resourceType === 'EC2_Instance');
  for (const instance of ec2Instances) {
    const state = instance.state?.toLowerCase() || instance.metadata.state?.toLowerCase();
    
    if (state === 'stopped') {
      // Check how long it's been stopped
      const stateTransitionTime = instance.metadata.stateTransitionTime || 
                                   instance.metadata.StateTransitionReason ||
                                   instance.metadata.stoppedTime;
      
      if (stateTransitionTime) {
        const stoppedDate = new Date(stateTransitionTime);
        const daysStopped = (now.getTime() - stoppedDate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (daysStopped > 7) {
          const deduction = 3;
          score -= deduction;
          issues.push({
            type: 'stopped_instance_old',
            severity: 'medium',
            resourceId: instance.resourceId,
            resourceName: instance.resourceName,
            description: `EC2 instance "${instance.resourceName}" has been stopped for ${Math.floor(daysStopped)} days`,
            deduction,
            fixGuide: {
              title: 'Remove or Terminate Stopped Instance',
              steps: [
                'Review if this instance is still needed',
                'If not needed, terminate the instance to stop charges',
                'If needed occasionally, consider using AWS Lambda or ECS Fargate instead',
                'Create an AMI backup before terminating if needed for future use'
              ],
              cliCommands: [
                `aws ec2 create-image --instance-id ${instance.resourceId} --name "${instance.resourceName}-backup-$(date +%Y%m%d)"`,
                `aws ec2 terminate-instances --instance-ids ${instance.resourceId}`
              ],
              documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/terminating-instances.html'
            }
          });
        }
      }
    }
  }

  // Check for unattached EBS volumes (Requirement 4.10)
  const ebsVolumes = scanResult.resources.filter(r => r.resourceType === 'EBS_Volume');
  for (const volume of ebsVolumes) {
    const attachments = volume.metadata.attachments || volume.metadata.Attachments || [];
    const state = volume.state?.toLowerCase() || volume.metadata.state?.toLowerCase();
    
    // Volume is unattached if it has no attachments or state is 'available'
    if (attachments.length === 0 || state === 'available') {
      const deduction = 2;
      score -= deduction;
      issues.push({
        type: 'unattached_ebs_volume',
        severity: 'low',
        resourceId: volume.resourceId,
        resourceName: volume.resourceName,
        description: `EBS volume "${volume.resourceName}" is not attached to any instance`,
        deduction,
        fixGuide: {
          title: 'Remove Unattached EBS Volume',
          steps: [
            'Verify the volume is not needed',
            'Create a snapshot for backup if the data might be needed',
            'Delete the volume to stop incurring charges',
            'Set up lifecycle policies to automatically delete old snapshots'
          ],
          cliCommands: [
            `aws ec2 create-snapshot --volume-id ${volume.resourceId} --description "Backup before deletion"`,
            `aws ec2 delete-volume --volume-id ${volume.resourceId}`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-deleting-volume.html'
        }
      });
    }
  }

  // Check for oversized instances with low CPU utilization (Requirement 4.11)
  for (const instance of ec2Instances) {
    const state = instance.state?.toLowerCase() || instance.metadata.state?.toLowerCase();
    
    if (state === 'running') {
      const cpuUtilization = instance.metadata.cpuUtilization || instance.metadata.avgCpuUtilization;
      const instanceType = instance.metadata.instanceType || instance.metadata.InstanceType;
      
      // Check if CPU utilization data is available and is low
      if (cpuUtilization !== undefined && cpuUtilization < 20) {
        // Consider instances with consistently low CPU as oversized
        const deduction = 4;
        score -= deduction;
        issues.push({
          type: 'oversized_instance',
          severity: 'medium',
          resourceId: instance.resourceId,
          resourceName: instance.resourceName,
          description: `EC2 instance "${instance.resourceName}" (${instanceType}) has low CPU utilization (${cpuUtilization}%)`,
          deduction,
          fixGuide: {
            title: 'Right-Size EC2 Instance',
            steps: [
              'Review CloudWatch metrics for the past 2 weeks',
              'Identify a smaller instance type that meets your needs',
              'Stop the instance and change the instance type',
              'Start the instance and monitor performance',
              'Consider using AWS Compute Optimizer for recommendations'
            ],
            cliCommands: [
              `aws ec2 stop-instances --instance-ids ${instance.resourceId}`,
              `aws ec2 modify-instance-attribute --instance-id ${instance.resourceId} --instance-type "{Value=SMALLER_TYPE}"`,
              `aws ec2 start-instances --instance-ids ${instance.resourceId}`
            ],
            documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-resize.html'
          }
        });
      }
    }
  }

  // Check for unassociated Elastic IPs (Requirement 4.12)
  const elasticIPs = scanResult.resources.filter(r => r.resourceType === 'Elastic_IP');
  for (const eip of elasticIPs) {
    const associationId = eip.metadata.associationId || eip.metadata.AssociationId;
    const instanceId = eip.metadata.instanceId || eip.metadata.InstanceId;
    
    // EIP is unassociated if it has no association ID or instance ID
    if (!associationId && !instanceId) {
      const deduction = 2;
      score -= deduction;
      issues.push({
        type: 'unassociated_elastic_ip',
        severity: 'low',
        resourceId: eip.resourceId,
        resourceName: eip.resourceName || eip.metadata.publicIp || eip.metadata.PublicIp,
        description: `Elastic IP "${eip.resourceName || eip.metadata.publicIp || eip.resourceId}" is not associated with any instance`,
        deduction,
        fixGuide: {
          title: 'Release Unassociated Elastic IP',
          steps: [
            'Verify the Elastic IP is not needed',
            'Release the Elastic IP to stop incurring charges',
            'Note: Unassociated Elastic IPs incur charges even when not in use'
          ],
          cliCommands: [
            `aws ec2 release-address --allocation-id ${eip.resourceId}`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html#using-instance-addressing-eips-releasing'
        }
      });
    }
  }

  return {
    score: Math.max(0, score),
    maxScore: COST_EFFICIENCY_WEIGHT,
    issues,
  };
}

/**
 * Calculate best practices score component (30% of total)
 * 
 * Requirements:
 * - 4.13: Weight best practices factors at 30%
 * - 4.14: Deduct for resources without proper tags
 * - 4.15: Deduct for missing backup policies
 * - 4.16: Deduct for disabled CloudWatch monitoring
 * 
 * @param scanResult - The scan result to analyze
 * @returns Best practices score component
 */
export function calculateBestPracticesScore(scanResult: ScanResult): ScoreComponent {
  const issues: Issue[] = [];
  let score = BEST_PRACTICES_WEIGHT;

  // Required tags for best practices
  const REQUIRED_TAGS = ['Environment', 'Owner', 'Project'];

  // Check for resources without required tags (Requirement 4.14)
  const taggableResources = scanResult.resources.filter(r => 
    ['EC2_Instance', 'EBS_Volume', 'RDS_Instance', 'Lambda_Function', 'S3_Bucket'].includes(r.resourceType)
  );

  for (const resource of taggableResources) {
    const tags = resource.tags || {};
    const tagKeys = Object.keys(tags);
    const missingTags = REQUIRED_TAGS.filter(tag => !tagKeys.includes(tag));

    if (missingTags.length > 0) {
      const deduction = 2;
      score -= deduction;
      issues.push({
        type: 'missing_tags',
        severity: 'low',
        resourceId: resource.resourceId,
        resourceName: resource.resourceName,
        description: `${resource.resourceType} "${resource.resourceName}" is missing required tags: ${missingTags.join(', ')}`,
        deduction,
        fixGuide: {
          title: 'Add Required Tags',
          steps: [
            'Add the following tags to the resource:',
            ...REQUIRED_TAGS.map(tag => `  - ${tag}: (appropriate value)`),
            'Use consistent tag values across your infrastructure',
            'Consider using AWS Config to enforce tagging policies'
          ],
          cliCommands: [
            `aws ec2 create-tags --resources ${resource.resourceId} --tags Key=Environment,Value=production Key=Owner,Value=team Key=Project,Value=project-name`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html'
        }
      });
    }
  }

  // Check for missing backup policies on RDS and EBS (Requirement 4.15)
  const rdsInstances = scanResult.resources.filter(r => r.resourceType === 'RDS_Instance');
  for (const rds of rdsInstances) {
    const backupRetentionPeriod = rds.metadata.backupRetentionPeriod || rds.metadata.BackupRetentionPeriod;
    
    // RDS should have backup retention of at least 7 days
    if (!backupRetentionPeriod || backupRetentionPeriod < 7) {
      const deduction = 3;
      score -= deduction;
      issues.push({
        type: 'missing_backup_policy_rds',
        severity: 'medium',
        resourceId: rds.resourceId,
        resourceName: rds.resourceName,
        description: `RDS instance "${rds.resourceName}" has insufficient backup retention (${backupRetentionPeriod || 0} days)`,
        deduction,
        fixGuide: {
          title: 'Enable RDS Backup Policy',
          steps: [
            'Set backup retention period to at least 7 days',
            'Enable automated backups',
            'Consider enabling Multi-AZ for critical databases',
            'Test backup restoration regularly'
          ],
          cliCommands: [
            `aws rds modify-db-instance --db-instance-identifier ${rds.resourceId} --backup-retention-period 7 --apply-immediately`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html'
        }
      });
    }
  }

  // Check for EBS volumes without snapshots (Requirement 4.15)
  const ebsVolumes = scanResult.resources.filter(r => r.resourceType === 'EBS_Volume');
  for (const volume of ebsVolumes) {
    const hasSnapshots = volume.metadata.hasSnapshots === true || 
                        (volume.metadata.snapshots && volume.metadata.snapshots.length > 0);
    
    if (!hasSnapshots) {
      const deduction = 2;
      score -= deduction;
      issues.push({
        type: 'missing_backup_policy_ebs',
        severity: 'low',
        resourceId: volume.resourceId,
        resourceName: volume.resourceName,
        description: `EBS volume "${volume.resourceName}" has no snapshots for backup`,
        deduction,
        fixGuide: {
          title: 'Create EBS Volume Snapshots',
          steps: [
            'Create a snapshot of the volume',
            'Set up a lifecycle policy to create regular snapshots',
            'Consider using AWS Data Lifecycle Manager for automated snapshots',
            'Test snapshot restoration regularly'
          ],
          cliCommands: [
            `aws ec2 create-snapshot --volume-id ${volume.resourceId} --description "Backup snapshot"`,
            `aws dlm create-lifecycle-policy --execution-role-arn arn:aws:iam::ACCOUNT_ID:role/service-role/AWSDataLifecycleManagerDefaultRole --description "Daily snapshots" --state ENABLED --policy-details PolicyType=EBS_SNAPSHOT_MANAGEMENT,ResourceTypes=VOLUME,TargetTags=Key=Backup,Value=true,Schedules=[{Name=Daily,CreateRule={Interval=24,IntervalUnit=HOURS},RetainRule={Count=7}}]`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-snapshots.html'
        }
      });
    }
  }

  // Check for disabled CloudWatch monitoring (Requirement 4.16)
  const ec2Instances = scanResult.resources.filter(r => r.resourceType === 'EC2_Instance');
  for (const instance of ec2Instances) {
    const monitoringState = instance.metadata.monitoringState || instance.metadata.Monitoring?.State;
    
    // Detailed monitoring should be enabled
    if (monitoringState !== 'enabled' && monitoringState !== 'detailed') {
      const deduction = 2;
      score -= deduction;
      issues.push({
        type: 'disabled_cloudwatch_monitoring',
        severity: 'low',
        resourceId: instance.resourceId,
        resourceName: instance.resourceName,
        description: `EC2 instance "${instance.resourceName}" does not have detailed CloudWatch monitoring enabled`,
        deduction,
        fixGuide: {
          title: 'Enable CloudWatch Monitoring',
          steps: [
            'Enable detailed monitoring for the EC2 instance',
            'Set up CloudWatch alarms for key metrics (CPU, disk, network)',
            'Create a CloudWatch dashboard for visibility',
            'Consider using CloudWatch Insights for log analysis'
          ],
          cliCommands: [
            `aws ec2 monitor-instances --instance-ids ${instance.resourceId}`,
            `aws cloudwatch put-metric-alarm --alarm-name ${instance.resourceName}-high-cpu --alarm-description "Alert when CPU exceeds 80%" --metric-name CPUUtilization --namespace AWS/EC2 --statistic Average --period 300 --threshold 80 --comparison-operator GreaterThanThreshold --evaluation-periods 2 --dimensions Name=InstanceId,Value=${instance.resourceId}`
          ],
          documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-cloudwatch-new.html'
        }
      });
    }
  }

  return {
    score: Math.max(0, score),
    maxScore: BEST_PRACTICES_WEIGHT,
    issues,
  };
}

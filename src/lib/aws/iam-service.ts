// AWS IAM Service
// Fetches IAM users, roles, and policies for security analysis

import {
    ListUsersCommand,
    ListRolesCommand,
    ListPoliciesCommand,
    GetAccountSummaryCommand,
    type User,
    type Role,
    type Policy,
} from '@aws-sdk/client-iam';
import { createIAMClient } from './client';
import { hasCredentials } from './credentials';

export interface IAMUser {
    userName: string;
    userId: string;
    arn: string;
    createDate: string;
    passwordLastUsed?: string;
}

export interface IAMRole {
    roleName: string;
    roleId: string;
    arn: string;
    createDate: string;
    description?: string;
}

export interface IAMPolicy {
    policyName: string;
    policyId: string;
    arn: string;
    createDate: string;
    attachmentCount: number;
    isAttachable: boolean;
}

export interface IAMSummary {
    users: IAMUser[];
    roles: IAMRole[];
    policies: IAMPolicy[];
    accountSummary: Record<string, number>;
    securityScore: number;
    findings: SecurityFinding[];
}

export interface SecurityFinding {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    resource?: string;
}

/**
 * Fetch IAM users
 */
async function getUsers(): Promise<IAMUser[]> {
    const client = createIAMClient();
    const response = await client.send(new ListUsersCommand({}));

    return (response.Users || []).map((user) => ({
        userName: user.UserName || '',
        userId: user.UserId || '',
        arn: user.Arn || '',
        createDate: user.CreateDate?.toISOString() || '',
        passwordLastUsed: user.PasswordLastUsed?.toISOString(),
    }));
}

/**
 * Fetch IAM roles
 */
async function getRoles(): Promise<IAMRole[]> {
    const client = createIAMClient();
    const response = await client.send(new ListRolesCommand({}));

    return (response.Roles || []).map((role) => ({
        roleName: role.RoleName || '',
        roleId: role.RoleId || '',
        arn: role.Arn || '',
        createDate: role.CreateDate?.toISOString() || '',
        description: role.Description,
    }));
}

/**
 * Fetch IAM policies (customer-managed)
 */
async function getPolicies(): Promise<IAMPolicy[]> {
    const client = createIAMClient();
    const response = await client.send(new ListPoliciesCommand({ Scope: 'Local' }));

    return (response.Policies || []).map((policy) => ({
        policyName: policy.PolicyName || '',
        policyId: policy.PolicyId || '',
        arn: policy.Arn || '',
        createDate: policy.CreateDate?.toISOString() || '',
        attachmentCount: policy.AttachmentCount || 0,
        isAttachable: policy.IsAttachable || false,
    }));
}

/**
 * Get account summary
 */
async function getAccountSummary(): Promise<Record<string, number>> {
    const client = createIAMClient();
    const response = await client.send(new GetAccountSummaryCommand({}));

    const summary: Record<string, number> = {};
    for (const [key, value] of Object.entries(response.SummaryMap || {})) {
        summary[key] = value;
    }
    return summary;
}

/**
 * Analyze security and generate findings
 */
function analyzeSecurityFindings(
    users: IAMUser[],
    roles: IAMRole[],
    summary: Record<string, number>
): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for root access keys
    if (summary['AccountAccessKeysPresent'] > 0) {
        findings.push({
            id: 'root-access-keys',
            severity: 'critical',
            title: 'Root Account Access Keys Found',
            description: 'Root account has active access keys. Remove them and use IAM users instead.',
        });
    }

    // Check MFA for root
    if (summary['AccountMFAEnabled'] === 0) {
        findings.push({
            id: 'root-no-mfa',
            severity: 'critical',
            title: 'Root Account MFA Not Enabled',
            description: 'Enable MFA on the root account for improved security.',
        });
    }

    // Check for users without recent activity
    const staleDays = 90;
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - staleDays);

    for (const user of users) {
        if (user.passwordLastUsed) {
            const lastUsed = new Date(user.passwordLastUsed);
            if (lastUsed < staleDate) {
                findings.push({
                    id: `stale-user-${user.userName}`,
                    severity: 'medium',
                    title: `Inactive User: ${user.userName}`,
                    description: `User has not signed in for over ${staleDays} days.`,
                    resource: user.userName,
                });
            }
        }
    }

    // Check for too many policies
    if (summary['Policies'] > 50) {
        findings.push({
            id: 'too-many-policies',
            severity: 'low',
            title: 'High Number of IAM Policies',
            description: 'Consider consolidating IAM policies for easier management.',
        });
    }

    return findings;
}

/**
 * Calculate security score (0-100)
 */
function calculateSecurityScore(findings: SecurityFinding[]): number {
    let score = 100;

    for (const finding of findings) {
        switch (finding.severity) {
            case 'critical':
                score -= 25;
                break;
            case 'high':
                score -= 15;
                break;
            case 'medium':
                score -= 10;
                break;
            case 'low':
                score -= 5;
                break;
        }
    }

    return Math.max(0, score);
}

/**
 * Get full IAM summary with security analysis
 */
export async function getIAMSummary(): Promise<IAMSummary> {
    if (!hasCredentials()) {
        throw new Error('AWS credentials not configured');
    }

    const [users, roles, policies, accountSummary] = await Promise.all([
        getUsers(),
        getRoles(),
        getPolicies(),
        getAccountSummary(),
    ]);

    const findings = analyzeSecurityFindings(users, roles, accountSummary);
    const securityScore = calculateSecurityScore(findings);

    return {
        users,
        roles,
        policies,
        accountSummary,
        securityScore,
        findings,
    };
}

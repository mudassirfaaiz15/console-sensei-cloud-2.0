import { supabase, isDemoMode } from '@/lib/supabase';

// Types
export interface SecurityFinding {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    affectedResources: number;
    status: 'open' | 'in_progress' | 'resolved';
    recommendation: string;
}

export interface ComplianceCheck {
    name: string;
    passed: number;
    total: number;
    percentage: number;
}

export interface SecurityData {
    findings: SecurityFinding[];
    complianceChecks: ComplianceCheck[];
    securityScore: number;
    criticalCount: number;
    highCount: number;
}

// Demo data
const DEMO_FINDINGS: SecurityFinding[] = [
    {
        id: 'sec-1',
        title: 'S3 Buckets with Public Access',
        description: '2 S3 buckets have public access enabled.',
        severity: 'critical',
        category: 'Data Exposure',
        affectedResources: 2,
        status: 'open',
        recommendation: 'Review and disable public access for sensitive buckets.',
    },
    {
        id: 'sec-2',
        title: 'IAM Users without MFA',
        description: '5 IAM users do not have MFA enabled.',
        severity: 'high',
        category: 'Identity & Access',
        affectedResources: 5,
        status: 'open',
        recommendation: 'Enable MFA for all IAM users with console access.',
    },
    {
        id: 'sec-3',
        title: 'Security Groups with 0.0.0.0/0',
        description: '3 security groups allow inbound from any IP.',
        severity: 'high',
        category: 'Network Security',
        affectedResources: 3,
        status: 'in_progress',
        recommendation: 'Restrict security group rules to specific IP ranges.',
    },
    {
        id: 'sec-4',
        title: 'Unencrypted EBS Volumes',
        description: '8 EBS volumes are not encrypted at rest.',
        severity: 'medium',
        category: 'Encryption',
        affectedResources: 8,
        status: 'open',
        recommendation: 'Enable default EBS encryption.',
    },
];

const DEMO_COMPLIANCE: ComplianceCheck[] = [
    { name: 'CIS AWS Foundations', passed: 42, total: 55, percentage: 76 },
    { name: 'AWS Well-Architected', passed: 38, total: 50, percentage: 76 },
    { name: 'SOC 2 Controls', passed: 28, total: 35, percentage: 80 },
    { name: 'PCI DSS', passed: 22, total: 30, percentage: 73 },
];

// API Functions
export async function fetchSecurityData(): Promise<SecurityData> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const criticalCount = DEMO_FINDINGS.filter(f => f.severity === 'critical' && f.status !== 'resolved').length;
        const highCount = DEMO_FINDINGS.filter(f => f.severity === 'high' && f.status !== 'resolved').length;
        const resolvedCount = DEMO_FINDINGS.filter(f => f.status === 'resolved').length;
        const securityScore = Math.round((resolvedCount / DEMO_FINDINGS.length) * 100);

        return {
            findings: DEMO_FINDINGS,
            complianceChecks: DEMO_COMPLIANCE,
            securityScore,
            criticalCount,
            highCount,
        };
    }

    const { data, error } = await supabase
        .from('security_data')
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateFindingStatus(id: string, status: SecurityFinding['status']): Promise<SecurityFinding> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const finding = DEMO_FINDINGS.find(f => f.id === id);
        if (!finding) throw new Error('Finding not found');
        return { ...finding, status };
    }

    const { data, error } = await supabase
        .from('security_findings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function runSecurityScan(): Promise<SecurityData> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate scan time
        return fetchSecurityData();
    }

    // Trigger a new security scan
    const { error } = await supabase.functions.invoke('run-security-scan');
    if (error) throw error;

    return fetchSecurityData();
}

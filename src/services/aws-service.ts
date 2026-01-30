import type { Resource, Alert, Activity, CostData, ResourceStatus, AlertType } from '@/types';

// Simulated delay for realistic API behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AWS resource data
const MOCK_RESOURCES: Resource[] = [
    {
        id: 'ec2-001',
        name: 'EC2 Instances Running',
        value: '3',
        status: 'warning' as ResourceStatus,
        description: '2 in free tier',
        type: 'ec2',
        region: 'us-east-1',
    },
    {
        id: 'ebs-001',
        name: 'Unused EBS Volumes',
        value: '2',
        status: 'critical' as ResourceStatus,
        description: '$12/month waste',
        type: 'ebs',
        region: 'us-east-1',
    },
    {
        id: 'eip-001',
        name: 'Unattached Elastic IPs',
        value: '1',
        status: 'critical' as ResourceStatus,
        description: '$3.60/month cost',
        type: 'eip',
        region: 'us-east-1',
    },
    {
        id: 'rds-001',
        name: 'RDS Instances',
        value: '1',
        status: 'warning' as ResourceStatus,
        description: 'Not free tier',
        type: 'rds',
        region: 'us-east-1',
    },
    {
        id: 'nat-001',
        name: 'NAT Gateways',
        value: '0',
        status: 'safe' as ResourceStatus,
        description: 'No cost',
        type: 'nat',
        region: 'us-east-1',
    },
    {
        id: 's3-001',
        name: 'Active S3 Buckets',
        value: '8',
        status: 'safe' as ResourceStatus,
        description: '2.4 GB total',
        type: 's3',
        region: 'global',
    },
];

const MOCK_ALERTS: Alert[] = [
    {
        id: 'alert-001',
        type: 'critical' as AlertType,
        title: 'Unattached Elastic IP detected',
        description: 'IP 54.123.45.67 may incur charges ($3.60/month)',
        time: '2 min ago',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
        id: 'alert-002',
        type: 'warning' as AlertType,
        title: 'EC2 instance running for 5+ hours',
        description: 't2.micro (i-0abc123) in us-east-1',
        time: '1 hour ago',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'alert-003',
        type: 'warning' as AlertType,
        title: 'RDS instance detected (not free tier)',
        description: 'db.t3.micro - PostgreSQL 14.7',
        time: '3 hours ago',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'alert-004',
        type: 'info' as AlertType,
        title: 'Unused EBS volume found',
        description: 'vol-0xyz789 (8 GB) unattached for 7 days',
        time: '5 hours ago',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
];

const MOCK_ACTIVITIES: Activity[] = [
    {
        id: 'activity-001',
        action: 'EC2 instance created',
        resource: 'i-0abc123def456',
        time: '10 minutes ago',
        user: 'admin',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        eventType: 'RunInstances',
    },
    {
        id: 'activity-002',
        action: 'Security group modified',
        resource: 'sg-0123456789',
        time: '1 hour ago',
        user: 'dev-user',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        eventType: 'AuthorizeSecurityGroupIngress',
    },
    {
        id: 'activity-003',
        action: 'S3 bucket created',
        resource: 'my-app-assets-2026',
        time: '3 hours ago',
        user: 'admin',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        eventType: 'CreateBucket',
    },
    {
        id: 'activity-004',
        action: 'IAM policy updated',
        resource: 'CustomS3Access',
        time: '1 day ago',
        user: 'admin',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        eventType: 'PutRolePolicy',
    },
];

const MOCK_COST_DATA: CostData[] = [
    { month: 'Jan', cost: 245 },
    { month: 'Feb', cost: 312 },
    { month: 'Mar', cost: 189 },
    { month: 'Apr', cost: 278 },
    { month: 'May', cost: 356 },
    { month: 'Jun', cost: 423 },
];

export interface HygieneScore {
    overall: number;
    security: number;
    costEfficiency: number;
    bestPractices: number;
    criticalIssues: number;
    recommendations: string[];
}

const MOCK_HYGIENE_SCORE: HygieneScore = {
    overall: 72,
    security: 65,
    costEfficiency: 78,
    bestPractices: 74,
    criticalIssues: 2,
    recommendations: [
        'Release unattached Elastic IP to save $3.60/month',
        'Delete unused EBS volumes to save $12/month',
        'Consider using Reserved Instances for long-running EC2',
    ],
};

/**
 * AWS Service - Mock implementation
 * Replace these with real AWS SDK calls when connecting to actual AWS
 */
export const awsService = {
    /**
     * Fetch all AWS resources
     */
    async getResources(): Promise<Resource[]> {
        await delay(800);
        return MOCK_RESOURCES;
    },

    /**
     * Fetch resources by type
     */
    async getResourcesByType(type: string): Promise<Resource[]> {
        await delay(600);
        return MOCK_RESOURCES.filter(r => r.type === type);
    },

    /**
     * Fetch alerts
     */
    async getAlerts(): Promise<Alert[]> {
        await delay(600);
        return MOCK_ALERTS;
    },

    /**
     * Dismiss an alert
     */
    async dismissAlert(alertId: string): Promise<void> {
        await delay(300);
        console.log('Alert dismissed:', alertId);
    },

    /**
     * Fetch activities (CloudTrail events)
     */
    async getActivities(limit = 10): Promise<Activity[]> {
        await delay(700);
        return MOCK_ACTIVITIES.slice(0, limit);
    },

    /**
     * Fetch cost data
     */
    async getCostData(months = 6): Promise<CostData[]> {
        await delay(500);
        return MOCK_COST_DATA.slice(-months);
    },

    /**
     * Get current month cost
     */
    async getCurrentMonthCost(): Promise<number> {
        await delay(300);
        return MOCK_COST_DATA[MOCK_COST_DATA.length - 1].cost;
    },

    /**
     * Get hygiene score
     */
    async getHygieneScore(): Promise<HygieneScore> {
        await delay(600);
        return MOCK_HYGIENE_SCORE;
    },

    /**
     * Run a new scan
     */
    async runScan(): Promise<{ success: boolean; resourcesScanned: number }> {
        await delay(2000);
        return {
            success: true,
            resourcesScanned: Math.floor(Math.random() * 50) + 20,
        };
    },

    /**
     * Connect AWS account
     */
    async connectAccount(_accessKeyId: string, _secretAccessKey: string, _region: string): Promise<{ success: boolean; accountId: string }> {
        await delay(1500);
        // In production, this would validate credentials with AWS STS
        return {
            success: true,
            accountId: '123456789012',
        };
    },

    /**
     * Disconnect AWS account
     */
    async disconnectAccount(): Promise<void> {
        await delay(500);
        console.log('AWS account disconnected');
    },
};

import type { Resource, Alert, Activity, CostData, ResourceStatus, AlertType } from '@/types';

// Mock data for Vercel deployment without backend
const MOCK_RESOURCES: Resource[] = [
    { id: 'i-1234567890abcdef0', name: 'web-server-prod', value: '1', status: 'safe', description: 'running', type: 'ec2', region: 'us-east-1' },
    { id: 'i-0987654321fedcba0', name: 'api-server-prod', value: '1', status: 'safe', description: 'running', type: 'ec2', region: 'us-west-2' },
    { id: 'vol-1234567890abcdef0', name: 'data-volume', value: '100', status: 'safe', description: 'in-use', type: 'ebs', region: 'us-east-1' },
    { id: 'bucket-prod-data', name: 'prod-data-bucket', value: '1', status: 'warning', description: 'public access', type: 's3', region: 'us-east-1' },
    { id: 'db-prod-mysql', name: 'prod-database', value: '1', status: 'safe', description: 'available', type: 'rds', region: 'us-east-1' },
    { id: 'lambda-processor', name: 'image-processor', value: '1', status: 'safe', description: 'active', type: 'lambda', region: 'us-east-1' },
    { id: 'sg-1234567890abcdef0', name: 'web-sg', value: '1', status: 'warning', description: 'open to 0.0.0.0/0', type: 'security-group', region: 'us-east-1' },
    { id: 'eip-1234567890abcdef0', name: 'nat-eip', value: '1', status: 'safe', description: 'associated', type: 'elastic-ip', region: 'us-east-1' },
];

const MOCK_ALERTS: Alert[] = [
    { id: 'alert-1', type: 'critical', title: 'Public S3 Bucket Detected', description: 'S3 bucket "prod-data-bucket" is publicly accessible', time: new Date(Date.now() - 3600000).toLocaleString(), timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'alert-2', type: 'high', title: 'Security Group Too Permissive', description: 'Security group allows SSH access from 0.0.0.0/0', time: new Date(Date.now() - 7200000).toLocaleString(), timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'alert-3', type: 'medium', title: 'Unencrypted EBS Volume', description: 'EBS volume "data-volume" is not encrypted', time: new Date(Date.now() - 86400000).toLocaleString(), timestamp: new Date(Date.now() - 86400000).toISOString() },
];

const MOCK_COST_DATA: CostData[] = [
    { month: 'Jan', cost: 1250 },
    { month: 'Feb', cost: 1380 },
    { month: 'Mar', cost: 1520 },
    { month: 'Apr', cost: 1450 },
    { month: 'May', cost: 1680 },
    { month: 'Jun', cost: 1850 },
];

export interface HygieneScore {
    overall: number;
    security: number;
    costEfficiency: number;
    bestPractices: number;
    criticalIssues: number;
    recommendations: string[];
}

/**
 * AWS Service - Mock implementation for Vercel deployment
 * Uses mock data instead of backend API calls
 */
export const awsService = {
    /**
     * Fetch all AWS resources from mock data
     */
    async getResources(): Promise<Resource[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_RESOURCES;
    },

    /**
     * Fetch resources by type
     */
    async getResourcesByType(type: string): Promise<Resource[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_RESOURCES.filter(r => r.type === type);
    },

    /**
     * Fetch alerts from mock data
     */
    async getAlerts(): Promise<Alert[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_ALERTS;
    },

    /**
     * Dismiss an alert
     */
    async dismissAlert(_alertId: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100));
    },

    /**
     * Fetch activities
     */
    async getActivities(_limit = 10): Promise<Activity[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return [];
    },

    /**
     * Fetch cost data from mock data
     */
    async getCostData(_months = 6): Promise<CostData[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_COST_DATA;
    },

    /**
     * Get current month cost
     */
    async getCurrentMonthCost(): Promise<number> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 1850;
    },

    /**
     * Get hygiene score
     */
    async getHygieneScore(): Promise<HygieneScore> {
        await new Promise(resolve => setTimeout(resolve, 400));
        return {
            overall: 72,
            security: 65,
            costEfficiency: 78,
            bestPractices: 82,
            criticalIssues: 2,
            recommendations: [
                'Make S3 bucket private and enable encryption',
                'Restrict security group access to specific IPs',
                'Enable encryption on EBS volumes',
            ],
        };
    },

    /**
     * Run a new scan
     */
    async runScan(): Promise<{ success: boolean; resourcesScanned: number }> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            success: true,
            resourcesScanned: MOCK_RESOURCES.length,
        };
    },

    /**
     * Connect AWS account
     */
    async connectAccount(_accessKeyId: string, _secretAccessKey: string, _region: string): Promise<{ success: boolean; accountId: string }> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            success: true,
            accountId: '123456789012',
        };
    },

    /**
     * Disconnect AWS account
     */
    async disconnectAccount(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
    },
};

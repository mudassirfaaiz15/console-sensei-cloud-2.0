import { supabase, isDemoMode } from '@/lib/supabase';

// Types
export interface ActivityEvent {
    id: string;
    type: 'account' | 'security' | 'cost' | 'team' | 'system';
    action: string;
    description: string;
    user: string;
    userEmail: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
    severity: 'info' | 'warning' | 'error' | 'success';
}

// Demo data
const DEMO_ACTIVITIES: ActivityEvent[] = [
    {
        id: 'act-1',
        type: 'security',
        action: 'Security Scan Completed',
        description: 'Automated security scan found 2 new critical issues',
        user: 'System',
        userEmail: 'system@consolesensei.cloud',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        severity: 'warning',
    },
    {
        id: 'act-2',
        type: 'account',
        action: 'Account Synced',
        description: 'Production account synced successfully - 156 resources discovered',
        user: 'John Doe',
        userEmail: 'john@example.com',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        severity: 'success',
    },
    {
        id: 'act-3',
        type: 'cost',
        action: 'Budget Alert Triggered',
        description: 'Monthly spending exceeded 80% of budget ($2,400 / $3,000)',
        user: 'System',
        userEmail: 'system@consolesensei.cloud',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        severity: 'warning',
    },
    {
        id: 'act-4',
        type: 'team',
        action: 'Member Invited',
        description: 'alex@example.com was invited to join the team as Member',
        user: 'Jane Smith',
        userEmail: 'jane@example.com',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        severity: 'info',
    },
    {
        id: 'act-5',
        type: 'account',
        action: 'New Account Connected',
        description: 'Staging account (234567890123) was connected',
        user: 'John Doe',
        userEmail: 'john@example.com',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        severity: 'success',
    },
    {
        id: 'act-6',
        type: 'security',
        action: 'Issue Resolved',
        description: 'S3 public access issue was marked as resolved',
        user: 'Mike Johnson',
        userEmail: 'mike@example.com',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        severity: 'success',
    },
    {
        id: 'act-7',
        type: 'system',
        action: 'Report Generated',
        description: 'Monthly cost report was exported as PDF',
        user: 'Jane Smith',
        userEmail: 'jane@example.com',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        severity: 'info',
    },
    {
        id: 'act-8',
        type: 'cost',
        action: 'Recommendation Applied',
        description: 'Deleted 3 unused Elastic IPs, saving $10.80/month',
        user: 'John Doe',
        userEmail: 'john@example.com',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        severity: 'success',
    },
];

// API Functions
export async function fetchActivityLog(limit: number = 50): Promise<ActivityEvent[]> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return DEMO_ACTIVITIES.slice(0, limit);
    }

    const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export async function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const newEvent: ActivityEvent = {
        ...event,
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };

    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return newEvent;
    }

    const { data, error } = await supabase
        .from('activity_log')
        .insert(newEvent)
        .select()
        .single();

    if (error) throw error;
    return data;
}

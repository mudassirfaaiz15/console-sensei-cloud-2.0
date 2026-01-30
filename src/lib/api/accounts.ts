import { supabase, isDemoMode } from '@/lib/supabase';

// Types
export interface AWSAccount {
    id: string;
    name: string;
    accountId: string;
    status: 'connected' | 'error' | 'syncing';
    lastSync: string;
    resourceCount: number;
    monthlyCost: number;
    hygieneScore: number;
    region: string;
}

// Demo data for when Supabase is not configured
const DEMO_ACCOUNTS: AWSAccount[] = [
    {
        id: 'acc-1',
        name: 'Production',
        accountId: '123456789012',
        status: 'connected',
        lastSync: '5 minutes ago',
        resourceCount: 156,
        monthlyCost: 2340,
        hygieneScore: 85,
        region: 'us-east-1',
    },
    {
        id: 'acc-2',
        name: 'Staging',
        accountId: '234567890123',
        status: 'connected',
        lastSync: '1 hour ago',
        resourceCount: 78,
        monthlyCost: 890,
        hygieneScore: 72,
        region: 'us-west-2',
    },
    {
        id: 'acc-3',
        name: 'Development',
        accountId: '345678901234',
        status: 'syncing',
        lastSync: '2 hours ago',
        resourceCount: 45,
        monthlyCost: 430,
        hygieneScore: 68,
        region: 'eu-west-1',
    },
];

// API Functions
export async function fetchAccounts(): Promise<AWSAccount[]> {
    if (isDemoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return DEMO_ACCOUNTS;
    }

    const { data, error } = await supabase
        .from('aws_accounts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function addAccount(account: Omit<AWSAccount, 'id'>): Promise<AWSAccount> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { ...account, id: `acc-${Date.now()}` };
    }

    const { data, error } = await supabase
        .from('aws_accounts')
        .insert(account)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteAccount(id: string): Promise<void> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
    }

    const { error } = await supabase
        .from('aws_accounts')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function syncAccount(id: string): Promise<AWSAccount> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const account = DEMO_ACCOUNTS.find(a => a.id === id);
        if (!account) throw new Error('Account not found');
        return { ...account, lastSync: 'Just now', status: 'connected' };
    }

    const { data, error } = await supabase
        .from('aws_accounts')
        .update({ last_sync: new Date().toISOString(), status: 'connected' })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

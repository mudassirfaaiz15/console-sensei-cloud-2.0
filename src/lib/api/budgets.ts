import { supabase, isDemoMode } from '@/lib/supabase';

// Types
export interface Budget {
    id: string;
    name: string;
    amount: number;
    spent: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    alertThresholds: number[]; // e.g., [50, 80, 100] for 50%, 80%, 100%
    notifyEmail: boolean;
    notifySlack: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BudgetAlert {
    id: string;
    budgetId: string;
    budgetName: string;
    threshold: number;
    currentSpend: number;
    budgetAmount: number;
    timestamp: string;
    acknowledged: boolean;
}

// Demo data
const DEMO_BUDGETS: Budget[] = [
    {
        id: 'budget-1',
        name: 'Monthly AWS Spend',
        amount: 3000,
        spent: 2450,
        period: 'monthly',
        alertThresholds: [50, 80, 100],
        notifyEmail: true,
        notifySlack: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
    },
    {
        id: 'budget-2',
        name: 'Production EC2',
        amount: 1500,
        spent: 1280,
        period: 'monthly',
        alertThresholds: [75, 90, 100],
        notifyEmail: true,
        notifySlack: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
    },
    {
        id: 'budget-3',
        name: 'Staging Environment',
        amount: 500,
        spent: 320,
        period: 'monthly',
        alertThresholds: [80, 100],
        notifyEmail: false,
        notifySlack: false,
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
    },
];

const DEMO_ALERTS: BudgetAlert[] = [
    {
        id: 'alert-1',
        budgetId: 'budget-1',
        budgetName: 'Monthly AWS Spend',
        threshold: 80,
        currentSpend: 2450,
        budgetAmount: 3000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
    },
    {
        id: 'alert-2',
        budgetId: 'budget-2',
        budgetName: 'Production EC2',
        threshold: 75,
        currentSpend: 1280,
        budgetAmount: 1500,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
    },
];

// Calculate budget percentage
export function getBudgetPercentage(budget: Budget): number {
    return Math.round((budget.spent / budget.amount) * 100);
}

// Get budget status
export function getBudgetStatus(budget: Budget): 'safe' | 'warning' | 'critical' {
    const percentage = getBudgetPercentage(budget);
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'safe';
}

// API Functions
export async function fetchBudgets(): Promise<Budget[]> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return DEMO_BUDGETS;
    }

    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function fetchBudgetAlerts(): Promise<BudgetAlert[]> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return DEMO_ALERTS;
    }

    const { data, error } = await supabase
        .from('budget_alerts')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spent'>): Promise<Budget> {
    const newBudget: Budget = {
        ...budget,
        id: `budget-${Date.now()}`,
        spent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return newBudget;
    }

    const { data, error } = await supabase
        .from('budgets')
        .insert(newBudget)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const budget = DEMO_BUDGETS.find(b => b.id === id);
        if (!budget) throw new Error('Budget not found');
        return { ...budget, ...updates, updatedAt: new Date().toISOString() };
    }

    const { data, error } = await supabase
        .from('budgets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteBudget(id: string): Promise<void> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return;
    }

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function acknowledgeAlert(id: string): Promise<void> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return;
    }

    const { error } = await supabase
        .from('budget_alerts')
        .update({ acknowledged: true })
        .eq('id', id);

    if (error) throw error;
}

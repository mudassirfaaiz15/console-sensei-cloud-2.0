import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import {
    Plus,
    DollarSign,
    Bell,
    BellRing,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Settings,
    Trash2,
    Mail,
    Edit,
} from 'lucide-react';
import { notifications } from '@/lib/notifications';
import { type Budget, type BudgetAlert, getBudgetPercentage, getBudgetStatus } from '@/lib/api/budgets';

// Mock data
const BUDGETS: Budget[] = [
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

const ALERTS: BudgetAlert[] = [
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

export function BudgetAlertsPage() {
    const [budgets, setBudgets] = useState<Budget[]>(BUDGETS);
    const [alerts, setAlerts] = useState<BudgetAlert[]>(ALERTS);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

    const handleAcknowledge = (alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, acknowledged: true } : a
        ));
        notifications.success('Alert acknowledged', 'The alert has been dismissed');
    };

    const handleDelete = (budgetId: string) => {
        setBudgets(prev => prev.filter(b => b.id !== budgetId));
        notifications.success('Budget deleted', 'The budget has been removed');
        setDetailsDialogOpen(false);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Budget Alerts</h1>
                    <p className="text-muted-foreground">
                        Set spending limits and get notified before exceeding budgets
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Budget
                </Button>
            </div>

            {/* Alert Banner */}
            {unacknowledgedAlerts > 0 && (
                <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <BellRing className="w-5 h-5 text-amber-500" />
                            <div className="flex-1">
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                    {unacknowledgedAlerts} active alert{unacknowledgedAlerts > 1 ? 's' : ''} require your attention
                                </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
                                notifications.success('All alerts dismissed');
                            }}>
                                Dismiss All
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <DollarSign className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Total Budget</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Spent This Month</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Bell className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{budgets.length}</div>
                                <div className="text-sm text-muted-foreground">Active Budgets</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{unacknowledgedAlerts}</div>
                                <div className="text-sm text-muted-foreground">Active Alerts</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                        <CardDescription>Budget threshold notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`flex items-center gap-4 p-4 rounded-lg border ${alert.acknowledged
                                        ? 'bg-muted/30 opacity-60'
                                        : 'bg-amber-500/5 border-amber-500/30'
                                        }`}
                                >
                                    {alert.acknowledged ? (
                                        <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium">{alert.budgetName}</div>
                                        <div className="text-sm text-muted-foreground">
                                            Reached {alert.threshold}% of budget (${alert.currentSpend.toLocaleString()} / ${alert.budgetAmount.toLocaleString()})
                                        </div>
                                    </div>
                                    {!alert.acknowledged && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleAcknowledge(alert.id)}
                                        >
                                            Acknowledge
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Budget List */}
            <Card>
                <CardHeader>
                    <CardTitle>Budgets</CardTitle>
                    <CardDescription>Manage your spending limits</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {budgets.map((budget) => {
                            const percentage = getBudgetPercentage(budget);
                            const status = getBudgetStatus(budget);

                            return (
                                <div
                                    key={budget.id}
                                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedBudget(budget);
                                        setDetailsDialogOpen(true);
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{budget.name}</span>
                                                <Badge variant="outline" className="capitalize">
                                                    {budget.period}
                                                </Badge>
                                                {status === 'critical' && (
                                                    <Badge variant="destructive">Over Budget</Badge>
                                                )}
                                                {status === 'warning' && (
                                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                                                        Warning
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                ${budget.spent.toLocaleString()} of ${budget.amount.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${status === 'critical' ? 'text-red-500' :
                                                status === 'warning' ? 'text-amber-500' : 'text-green-500'
                                                }`}>
                                                {percentage}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">used</div>
                                        </div>
                                    </div>
                                    <Progress
                                        value={Math.min(percentage, 100)}
                                        className={`h-2 ${status === 'critical' ? '[&>div]:bg-red-500' :
                                            status === 'warning' ? '[&>div]:bg-amber-500' : ''
                                            }`}
                                    />
                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                        <span>Alerts at: {budget.alertThresholds.join('%, ')}%</span>
                                        <span>•</span>
                                        <div className="flex items-center gap-2">
                                            {budget.notifyEmail && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> Email
                                                </span>
                                            )}
                                            {budget.notifySlack && (
                                                <span className="flex items-center gap-1">
                                                    <Bell className="w-3 h-3" /> Slack
                                                </span>
                                            )}
                                            {!budget.notifyEmail && !budget.notifySlack && (
                                                <span>No notifications</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Create Budget Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Budget</DialogTitle>
                        <DialogDescription>
                            Set up a new spending limit with custom alerts
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Budget Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Production EC2"
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Amount ($)</label>
                            <input
                                type="number"
                                placeholder="1000"
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Period</label>
                            <select className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background">
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="daily">Daily</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Alert Thresholds</label>
                            <div className="flex gap-2 mt-1">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm">50%</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm">80%</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm">100%</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Notifications</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">Email</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded" />
                                    <Bell className="w-4 h-4" />
                                    <span className="text-sm">Slack</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setCreateDialogOpen(false);
                            notifications.success('Budget created', 'Your budget is now active');
                        }}>
                            Create Budget
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Budget Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    {selectedBudget && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedBudget.name}</DialogTitle>
                                <DialogDescription>
                                    {selectedBudget.period.charAt(0).toUpperCase() + selectedBudget.period.slice(1)} budget
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium">Spending Progress</span>
                                        <span className="text-sm font-bold">
                                            {getBudgetPercentage(selectedBudget)}%
                                        </span>
                                    </div>
                                    <Progress value={getBudgetPercentage(selectedBudget)} className="h-3" />
                                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                        <span>${selectedBudget.spent.toLocaleString()} spent</span>
                                        <span>${(selectedBudget.amount - selectedBudget.spent).toLocaleString()} remaining</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-muted">
                                        <div className="text-sm text-muted-foreground">Budget</div>
                                        <div className="text-xl font-bold">${selectedBudget.amount.toLocaleString()}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted">
                                        <div className="text-sm text-muted-foreground">Spent</div>
                                        <div className="text-xl font-bold">${selectedBudget.spent.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Alerts
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(selectedBudget.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Budget
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

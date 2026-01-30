import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import {
    Plus,
    Cloud,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Settings,
    Trash2,
    RefreshCw,
    ExternalLink,
    Shield,
    DollarSign,
    Server,
    MoreVertical,
} from 'lucide-react';
import { notifications } from '@/lib/notifications';

interface AWSAccount {
    id: string;
    name: string;
    accountId: string;
    region: string;
    status: 'connected' | 'syncing' | 'error' | 'disconnected';
    lastSync: string;
    resourceCount: number;
    monthlyCost: number;
    hygieneScore: number;
    isPrimary: boolean;
}

// Mock data for AWS accounts
const MOCK_ACCOUNTS: AWSAccount[] = [
    {
        id: 'acc-1',
        name: 'Production',
        accountId: '123456789012',
        region: 'us-east-1',
        status: 'connected',
        lastSync: '5 minutes ago',
        resourceCount: 156,
        monthlyCost: 2450.00,
        hygieneScore: 78,
        isPrimary: true,
    },
    {
        id: 'acc-2',
        name: 'Staging',
        accountId: '234567890123',
        region: 'us-west-2',
        status: 'connected',
        lastSync: '12 minutes ago',
        resourceCount: 89,
        monthlyCost: 890.00,
        hygieneScore: 85,
        isPrimary: false,
    },
    {
        id: 'acc-3',
        name: 'Development',
        accountId: '345678901234',
        region: 'eu-west-1',
        status: 'syncing',
        lastSync: 'Syncing...',
        resourceCount: 45,
        monthlyCost: 320.00,
        hygieneScore: 92,
        isPrimary: false,
    },
    {
        id: 'acc-4',
        name: 'Legacy',
        accountId: '456789012345',
        region: 'ap-southeast-1',
        status: 'error',
        lastSync: 'Failed 2 hours ago',
        resourceCount: 0,
        monthlyCost: 0,
        hygieneScore: 0,
        isPrimary: false,
    },
];

const STATUS_CONFIG = {
    connected: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        label: 'Connected',
    },
    syncing: {
        icon: RefreshCw,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        label: 'Syncing',
    },
    error: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        label: 'Error',
    },
    disconnected: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        label: 'Disconnected',
    },
};

export function MultiAccountPage() {
    const [accounts, setAccounts] = useState<AWSAccount[]>(MOCK_ACCOUNTS);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AWSAccount | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const totalCost = accounts.reduce((sum, acc) => sum + acc.monthlyCost, 0);
    const totalResources = accounts.reduce((sum, acc) => sum + acc.resourceCount, 0);
    const connectedAccounts = accounts.filter(acc => acc.status === 'connected').length;

    const handleSync = (accountId: string) => {
        setAccounts(prev => prev.map(acc =>
            acc.id === accountId ? { ...acc, status: 'syncing' as const, lastSync: 'Syncing...' } : acc
        ));
        notifications.info('Syncing...', 'Fetching latest data from AWS');

        // Simulate sync completion
        setTimeout(() => {
            setAccounts(prev => prev.map(acc =>
                acc.id === accountId ? { ...acc, status: 'connected' as const, lastSync: 'Just now' } : acc
            ));
            notifications.success('Sync complete', 'Account data has been updated');
        }, 2000);
    };

    const handleRemove = (accountId: string) => {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        notifications.success('Account removed', 'The AWS account has been disconnected');
        setDetailsDialogOpen(false);
    };

    const handleSetPrimary = (accountId: string) => {
        setAccounts(prev => prev.map(acc => ({
            ...acc,
            isPrimary: acc.id === accountId
        })));
        notifications.success('Primary account updated', 'Dashboard will now show data from this account');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">AWS Accounts</h1>
                    <p className="text-muted-foreground">
                        Manage multiple AWS accounts from a single dashboard
                    </p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Cloud className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{accounts.length}</div>
                                <div className="text-sm text-muted-foreground">Total Accounts</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{connectedAccounts}</div>
                                <div className="text-sm text-muted-foreground">Connected</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Server className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalResources}</div>
                                <div className="text-sm text-muted-foreground">Total Resources</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Monthly Cost</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Account List */}
            <div className="grid gap-4">
                {accounts.map((account) => {
                    const statusConfig = STATUS_CONFIG[account.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                        <Card
                            key={account.id}
                            className={`hover:border-primary/50 transition-colors cursor-pointer ${account.isPrimary ? 'border-primary/30 bg-primary/5' : ''
                                }`}
                            onClick={() => {
                                setSelectedAccount(account);
                                setDetailsDialogOpen(true);
                            }}
                        >
                            <CardContent className="py-4">
                                <div className="flex items-center gap-4">
                                    {/* Status Icon */}
                                    <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
                                        <StatusIcon className={`w-6 h-6 ${statusConfig.color} ${account.status === 'syncing' ? 'animate-spin' : ''
                                            }`} />
                                    </div>

                                    {/* Account Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{account.name}</h3>
                                            {account.isPrimary && (
                                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                                            )}
                                            <Badge variant="outline" className={statusConfig.color}>
                                                {statusConfig.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span className="font-mono">{account.accountId}</span>
                                            <span>•</span>
                                            <span>{account.region}</span>
                                            <span>•</span>
                                            <span>{account.lastSync}</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-lg font-bold">{account.resourceCount}</div>
                                            <div className="text-xs text-muted-foreground">Resources</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold">${account.monthlyCost.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">Monthly</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-lg font-bold ${account.hygieneScore >= 80 ? 'text-green-500' :
                                                    account.hygieneScore >= 60 ? 'text-amber-500' : 'text-red-500'
                                                }`}>
                                                {account.hygieneScore || '-'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Score</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleSync(account.id)}
                                            disabled={account.status === 'syncing'}
                                        >
                                            <RefreshCw className={`w-4 h-4 ${account.status === 'syncing' ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Add Account Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect AWS Account</DialogTitle>
                        <DialogDescription>
                            Add a new AWS account to monitor. You'll need to configure IAM permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Account Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Production"
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">AWS Account ID</label>
                            <input
                                type="text"
                                placeholder="123456789012"
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Region</label>
                            <select className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background">
                                <option value="us-east-1">US East (N. Virginia)</option>
                                <option value="us-west-2">US West (Oregon)</option>
                                <option value="eu-west-1">EU (Ireland)</option>
                                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                            </select>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-primary mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">IAM Role Required</p>
                                    <p className="text-muted-foreground mt-1">
                                        You'll need to create an IAM role with read permissions for ConsoleSensei to access your AWS resources.
                                    </p>
                                    <Button variant="link" className="h-auto p-0 mt-2">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View Setup Guide
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setAddDialogOpen(false);
                            notifications.success('Account added', 'Starting initial sync...');
                        }}>
                            Connect Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    {selectedAccount && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${STATUS_CONFIG[selectedAccount.status].bg}`}>
                                        <Cloud className={`w-5 h-5 ${STATUS_CONFIG[selectedAccount.status].color}`} />
                                    </div>
                                    <div>
                                        <DialogTitle>{selectedAccount.name}</DialogTitle>
                                        <DialogDescription className="font-mono">
                                            {selectedAccount.accountId}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                {/* Hygiene Score */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium">Cloud Hygiene Score</span>
                                        <span className="text-sm font-bold">{selectedAccount.hygieneScore}/100</span>
                                    </div>
                                    <Progress value={selectedAccount.hygieneScore} className="h-2" />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-lg bg-muted text-center">
                                        <Server className="w-5 h-5 mx-auto mb-2 text-primary" />
                                        <div className="text-2xl font-bold">{selectedAccount.resourceCount}</div>
                                        <div className="text-xs text-muted-foreground">Resources</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted text-center">
                                        <DollarSign className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
                                        <div className="text-2xl font-bold">${selectedAccount.monthlyCost}</div>
                                        <div className="text-xs text-muted-foreground">Monthly Cost</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted text-center">
                                        <Shield className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                                        <div className="text-2xl font-bold">3</div>
                                        <div className="text-xs text-muted-foreground">Issues</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleSync(selectedAccount.id)}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Sync Now
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                    </Button>
                                    {!selectedAccount.isPrimary && (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSetPrimary(selectedAccount.id)}
                                        >
                                            Set as Primary
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleRemove(selectedAccount.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove Account
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

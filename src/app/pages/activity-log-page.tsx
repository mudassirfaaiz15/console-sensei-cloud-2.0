import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    Activity,
    Filter,
    Download,
    RefreshCw,
    Shield,
    DollarSign,
    User,
    Cloud,
    Settings,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Info,
    XCircle,
} from 'lucide-react';
import type { ActivityEvent } from '@/lib/api/activity';

// Mock data - in production, use useActivityLog hook
const ACTIVITY_DATA: ActivityEvent[] = [
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

const TYPE_CONFIG = {
    security: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' },
    cost: { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    account: { icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    team: { icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    system: { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

const SEVERITY_CONFIG = {
    success: { icon: CheckCircle2, color: 'text-green-500', label: 'Success' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', label: 'Warning' },
    error: { icon: XCircle, color: 'text-red-500', label: 'Error' },
    info: { icon: Info, color: 'text-blue-500', label: 'Info' },
};

function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function ActivityLogPage() {
    const [filter, setFilter] = useState<string>('all');
    const [activities] = useState<ActivityEvent[]>(ACTIVITY_DATA);

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const todayCount = activities.filter(a => {
        const date = new Date(a.timestamp);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Activity Log</h1>
                    <p className="text-muted-foreground">
                        Track all actions and events across your accounts
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{activities.length}</div>
                                <div className="text-sm text-muted-foreground">Total Events</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{todayCount}</div>
                                <div className="text-sm text-muted-foreground">Today</div>
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
                                <div className="text-2xl font-bold">
                                    {activities.filter(a => a.severity === 'warning').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Warnings</div>
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
                                <div className="text-2xl font-bold">
                                    {activities.filter(a => a.severity === 'success').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Successful</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Tabs */}
            <Tabs defaultValue="all" onValueChange={setFilter}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="cost">Cost</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Timeline</CardTitle>
                            <CardDescription>
                                Recent events and actions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredActivities.map((activity) => {
                                    const typeConfig = TYPE_CONFIG[activity.type];
                                    const severityConfig = SEVERITY_CONFIG[activity.severity];
                                    const TypeIcon = typeConfig.icon;
                                    const SeverityIcon = severityConfig.icon;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            {/* Type Icon */}
                                            <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                                                <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold">{activity.action}</span>
                                                    <Badge variant="outline" className={severityConfig.color}>
                                                        <SeverityIcon className="w-3 h-3 mr-1" />
                                                        {severityConfig.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {activity.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>{activity.user}</span>
                                                    <span>•</span>
                                                    <span>{formatRelativeTime(activity.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

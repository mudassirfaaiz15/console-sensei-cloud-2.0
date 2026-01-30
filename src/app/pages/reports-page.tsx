import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
    FileText,
    Download,
    Calendar,
    DollarSign,
    Shield,
    User,
    Activity,
    Clock,
    Plus,
    CheckCircle2,
} from 'lucide-react';
import { notifications } from '@/lib/notifications';
import {
    exportCostReport,
    exportSecurityReport,
    exportActivityLog,
    exportTeamReport,
    exportBudgetReport,
} from '@/lib/export-utils';

interface Report {
    id: string;
    name: string;
    type: 'cost' | 'security' | 'activity' | 'team' | 'budget';
    generatedAt: string;
    size: string;
    format: 'CSV' | 'PDF' | 'JSON';
}

const RECENT_REPORTS: Report[] = [
    {
        id: 'report-1',
        name: 'Monthly Cost Report - January 2026',
        type: 'cost',
        generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        size: '24 KB',
        format: 'CSV',
    },
    {
        id: 'report-2',
        name: 'Security Audit Report',
        type: 'security',
        generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        size: '56 KB',
        format: 'PDF',
    },
    {
        id: 'report-3',
        name: 'Team Activity Log - Week 4',
        type: 'activity',
        generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        size: '18 KB',
        format: 'CSV',
    },
];

const REPORT_TYPES = [
    {
        id: 'cost',
        name: 'Cost Report',
        description: 'Detailed breakdown of AWS spending by service',
        icon: DollarSign,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
    },
    {
        id: 'security',
        name: 'Security Audit',
        description: 'Security findings and compliance status',
        icon: Shield,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
    },
    {
        id: 'activity',
        name: 'Activity Log',
        description: 'All actions and events across accounts',
        icon: Activity,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    {
        id: 'team',
        name: 'Team Report',
        description: 'Team members and their access levels',
        icon: User,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
    },
    {
        id: 'budget',
        name: 'Budget Report',
        description: 'Budget utilization and alerts summary',
        icon: DollarSign,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
];

function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export function ReportsPage() {
    const [reports] = useState<Report[]>(RECENT_REPORTS);
    const [generating, setGenerating] = useState<string | null>(null);

    const handleGenerate = async (type: string, _format: 'CSV' | 'JSON' = 'CSV') => {
        setGenerating(type);

        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate report based on type
        const mockData = [
            { service: 'EC2', cost: 850, change: 12, usage: '24 instances' },
            { service: 'S3', cost: 320, change: -5, usage: '1.2 TB' },
            { service: 'RDS', cost: 450, change: 8, usage: '3 databases' },
        ];

        switch (type) {
            case 'cost':
                exportCostReport(mockData);
                break;
            case 'security':
                exportSecurityReport([
                    { title: 'Public S3 Bucket', severity: 'Critical', resource: 'my-bucket', status: 'Open', discoveredAt: '2026-01-15' },
                ]);
                break;
            case 'activity':
                exportActivityLog([
                    { timestamp: new Date().toISOString(), type: 'account', action: 'Sync', user: 'John', description: 'Account synced' },
                ]);
                break;
            case 'team':
                exportTeamReport([
                    { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', joinedAt: '2025-01-01' },
                ]);
                break;
            case 'budget':
                exportBudgetReport([
                    { name: 'Monthly AWS', amount: 3000, spent: 2450, percentage: 82, period: 'Monthly' },
                ]);
                break;
        }

        setGenerating(null);
        notifications.success('Report generated', `Your ${type} report has been downloaded`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reports</h1>
                    <p className="text-muted-foreground">
                        Generate and export reports for your cloud infrastructure
                    </p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Report
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{reports.length}</div>
                                <div className="text-sm text-muted-foreground">Recent Reports</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Calendar className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-sm text-muted-foreground">Scheduled</div>
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
                                <div className="text-2xl font-bold">5</div>
                                <div className="text-sm text-muted-foreground">Report Types</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Download className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-sm text-muted-foreground">This Month</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Types */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>
                        Select a report type to generate and download
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {REPORT_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isGenerating = generating === type.id;

                            return (
                                <div
                                    key={type.id}
                                    className="p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${type.bg}`}>
                                            <Icon className={`w-5 h-5 ${type.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{type.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {type.description}
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleGenerate(type.id, 'CSV')}
                                                    disabled={isGenerating}
                                                >
                                                    {isGenerating ? 'Generating...' : 'CSV'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleGenerate(type.id, 'JSON')}
                                                    disabled={isGenerating}
                                                >
                                                    JSON
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>
                        Previously generated reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {reports.map((report) => {
                            const typeConfig = REPORT_TYPES.find(t => t.id === report.type);
                            const Icon = typeConfig?.icon || FileText;

                            return (
                                <div
                                    key={report.id}
                                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className={`p-2 rounded-lg ${typeConfig?.bg || 'bg-muted'}`}>
                                        <Icon className={`w-5 h-5 ${typeConfig?.color || 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{report.name}</span>
                                            <Badge variant="outline">{report.format}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(report.generatedAt)}
                                            </span>
                                            <span>•</span>
                                            <span>{report.size}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

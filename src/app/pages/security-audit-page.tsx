import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    Shield,
    ShieldCheck,
    Info,
    Download,
    RefreshCw,
    ExternalLink,
    Lock,
    Key,
    HardDrive,
    Network,
    Eye,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';

interface SecurityFinding {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    affectedResources: number;
    status: 'open' | 'in_progress' | 'resolved';
    recommendation: string;
}

const SECURITY_FINDINGS: SecurityFinding[] = [
    {
        id: 'sec-1',
        title: 'S3 Buckets with Public Access',
        description: '2 S3 buckets have public access enabled, potentially exposing sensitive data.',
        severity: 'critical',
        category: 'Data Exposure',
        affectedResources: 2,
        status: 'open',
        recommendation: 'Review and disable public access for buckets containing sensitive data.',
    },
    {
        id: 'sec-2',
        title: 'IAM Users without MFA',
        description: '5 IAM users do not have multi-factor authentication enabled.',
        severity: 'high',
        category: 'Identity & Access',
        affectedResources: 5,
        status: 'open',
        recommendation: 'Enable MFA for all IAM users with console access.',
    },
    {
        id: 'sec-3',
        title: 'Security Groups with 0.0.0.0/0',
        description: '3 security groups allow inbound traffic from any IP address.',
        severity: 'high',
        category: 'Network Security',
        affectedResources: 3,
        status: 'in_progress',
        recommendation: 'Restrict security group rules to specific IP ranges.',
    },
    {
        id: 'sec-4',
        title: 'Unencrypted EBS Volumes',
        description: '8 EBS volumes do not have encryption enabled at rest.',
        severity: 'medium',
        category: 'Encryption',
        affectedResources: 8,
        status: 'open',
        recommendation: 'Enable default EBS encryption and create encrypted copies.',
    },
    {
        id: 'sec-5',
        title: 'Root Account Activity Detected',
        description: 'Root account was used for API calls in the last 30 days.',
        severity: 'medium',
        category: 'Identity & Access',
        affectedResources: 1,
        status: 'open',
        recommendation: 'Use IAM users instead of root account for daily operations.',
    },
    {
        id: 'sec-6',
        title: 'CloudTrail Not Enabled',
        description: 'CloudTrail logging is not enabled in 2 regions.',
        severity: 'medium',
        category: 'Logging & Monitoring',
        affectedResources: 2,
        status: 'resolved',
        recommendation: 'Enable CloudTrail in all regions for complete audit trail.',
    },
    {
        id: 'sec-7',
        title: 'Unused IAM Access Keys',
        description: '4 IAM access keys have not been used in over 90 days.',
        severity: 'low',
        category: 'Identity & Access',
        affectedResources: 4,
        status: 'open',
        recommendation: 'Rotate or delete unused access keys.',
    },
];

const COMPLIANCE_CHECKS = [
    { name: 'CIS AWS Foundations', passed: 42, total: 55, percentage: 76 },
    { name: 'AWS Well-Architected', passed: 38, total: 50, percentage: 76 },
    { name: 'SOC 2 Controls', passed: 28, total: 35, percentage: 80 },
    { name: 'PCI DSS', passed: 22, total: 30, percentage: 73 },
];

const CATEGORY_ICONS: Record<string, typeof Shield> = {
    'Data Exposure': HardDrive,
    'Identity & Access': Key,
    'Network Security': Network,
    'Encryption': Lock,
    'Logging & Monitoring': Eye,
};

const SEVERITY_CONFIG = {
    critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    high: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    low: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-red-500' },
    in_progress: { label: 'In Progress', color: 'bg-amber-500' },
    resolved: { label: 'Resolved', color: 'bg-green-500' },
};

export function SecurityAuditPage() {
    const [activeTab, setActiveTab] = useState('findings');
    const [severityFilter, setSeverityFilter] = useState<string | null>(null);

    const openFindings = SECURITY_FINDINGS.filter(f => f.status === 'open');
    const criticalCount = SECURITY_FINDINGS.filter(f => f.severity === 'critical' && f.status !== 'resolved').length;
    const highCount = SECURITY_FINDINGS.filter(f => f.severity === 'high' && f.status !== 'resolved').length;

    const filteredFindings = severityFilter
        ? SECURITY_FINDINGS.filter(f => f.severity === severityFilter)
        : SECURITY_FINDINGS;

    const securityScore = Math.round(
        (SECURITY_FINDINGS.filter(f => f.status === 'resolved').length / SECURITY_FINDINGS.length) * 100
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Security Audit</h1>
                    <p className="text-muted-foreground">
                        Review security findings and compliance status
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Run Scan
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Security Score */}
            <Card className={`${criticalCount > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${criticalCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                                {criticalCount > 0 ? (
                                    <AlertCircle className="w-12 h-12 text-red-500" />
                                ) : (
                                    <ShieldCheck className="w-12 h-12 text-green-500" />
                                )}
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Security Score</div>
                                <div className={`text-4xl font-bold ${criticalCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {securityScore}/100
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-background">
                                <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
                                <div className="text-xs text-muted-foreground">Critical</div>
                            </div>
                            <div className="p-4 rounded-lg bg-background">
                                <div className="text-2xl font-bold text-orange-500">{highCount}</div>
                                <div className="text-xs text-muted-foreground">High</div>
                            </div>
                            <div className="p-4 rounded-lg bg-background">
                                <div className="text-2xl font-bold text-amber-500">
                                    {SECURITY_FINDINGS.filter(f => f.severity === 'medium' && f.status !== 'resolved').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Medium</div>
                            </div>
                            <div className="p-4 rounded-lg bg-background">
                                <div className="text-2xl font-bold text-blue-500">
                                    {SECURITY_FINDINGS.filter(f => f.severity === 'low' && f.status !== 'resolved').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Low</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="findings">
                        Security Findings
                        <Badge variant="secondary" className="ml-2">{openFindings.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-4 mt-4">
                    {/* Severity Filter */}
                    <div className="flex gap-2">
                        <Button
                            variant={severityFilter === null ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setSeverityFilter(null)}
                        >
                            All
                        </Button>
                        {['critical', 'high', 'medium', 'low'].map((severity) => (
                            <Button
                                key={severity}
                                variant={severityFilter === severity ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setSeverityFilter(severity)}
                                className="capitalize"
                            >
                                {severity}
                            </Button>
                        ))}
                    </div>

                    {/* Findings List */}
                    <div className="space-y-4">
                        {filteredFindings.map((finding) => {
                            const severityConfig = SEVERITY_CONFIG[finding.severity];
                            const statusConfig = STATUS_CONFIG[finding.status];
                            const CategoryIcon = CATEGORY_ICONS[finding.category] || Shield;

                            return (
                                <Card
                                    key={finding.id}
                                    className={`${severityConfig.border} hover:border-primary/50 transition-colors cursor-pointer`}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${severityConfig.bg}`}>
                                                <CategoryIcon className={`w-5 h-5 ${severityConfig.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold">{finding.title}</h3>
                                                    <Badge className={`${severityConfig.bg} ${severityConfig.color} border-0 capitalize`}>
                                                        {finding.severity}
                                                    </Badge>
                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                                                        <span className="text-xs text-muted-foreground">{statusConfig.label}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        {finding.category}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {finding.affectedResources} affected resource{finding.affectedResources !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {finding.status !== 'resolved' && (
                                            <div className="mt-4 p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-start gap-2">
                                                    <Info className="w-4 h-4 text-primary mt-0.5" />
                                                    <div className="text-sm">
                                                        <span className="font-medium">Recommendation: </span>
                                                        <span className="text-muted-foreground">{finding.recommendation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4 mt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {COMPLIANCE_CHECKS.map((check) => (
                            <Card key={check.name}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{check.name}</CardTitle>
                                        <Badge
                                            variant={check.percentage >= 80 ? 'default' : check.percentage >= 60 ? 'secondary' : 'destructive'}
                                        >
                                            {check.percentage}%
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={check.percentage} className="h-2 mb-2" />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{check.passed} passed</span>
                                        <span>{check.total - check.passed} failed</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance Overview</CardTitle>
                            <CardDescription>
                                Track your compliance status across multiple frameworks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {COMPLIANCE_CHECKS.map((check) => (
                                    <div key={check.name} className="flex items-center gap-4">
                                        <div className="w-40 font-medium">{check.name}</div>
                                        <div className="flex-1">
                                            <Progress value={check.percentage} className="h-3" />
                                        </div>
                                        <div className="w-20 text-right">
                                            <span className="font-bold">{check.passed}</span>
                                            <span className="text-muted-foreground">/{check.total}</span>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

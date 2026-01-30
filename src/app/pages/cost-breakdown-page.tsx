import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Server,
    HardDrive,
    Database,
    Network,
    Download,
    Calendar,
    Filter,
    PieChart,
    BarChart2,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// Mock cost data
const MONTHLY_COSTS = [
    { month: 'Aug', cost: 3200, forecast: 3200 },
    { month: 'Sep', cost: 3450, forecast: 3450 },
    { month: 'Oct', cost: 3100, forecast: 3100 },
    { month: 'Nov', cost: 3680, forecast: 3680 },
    { month: 'Dec', cost: 3890, forecast: 3890 },
    { month: 'Jan', cost: 3660, forecast: 3660 },
    { month: 'Feb', cost: null, forecast: 3800 },
];

const SERVICE_COSTS = [
    { name: 'EC2', cost: 1450, change: 5.2, color: '#6366f1' },
    { name: 'RDS', cost: 890, change: -2.1, color: '#22c55e' },
    { name: 'S3', cost: 420, change: 12.5, color: '#f59e0b' },
    { name: 'Lambda', cost: 380, change: -8.3, color: '#ec4899' },
    { name: 'CloudFront', cost: 280, change: 3.1, color: '#8b5cf6' },
    { name: 'Other', cost: 240, change: 0, color: '#64748b' },
];

const RESOURCE_COSTS = [
    { id: 'i-0abc123', name: 'prod-api-server', type: 'EC2', cost: 450.00, trend: 'up', change: 12 },
    { id: 'i-0def456', name: 'prod-web-server', type: 'EC2', cost: 380.00, trend: 'down', change: -5 },
    { id: 'db-prod-001', name: 'production-db', type: 'RDS', cost: 520.00, trend: 'up', change: 8 },
    { id: 'eip-123', name: 'unused-elastic-ip', type: 'EIP', cost: 3.60, trend: 'stable', change: 0, alert: 'Unused resource' },
    { id: 'vol-abc', name: 'unattached-volume', type: 'EBS', cost: 25.00, trend: 'stable', change: 0, alert: 'Unattached' },
    { id: 'nat-123', name: 'nat-gateway-prod', type: 'NAT', cost: 95.00, trend: 'up', change: 15 },
];

const COST_RECOMMENDATIONS = [
    {
        id: 'rec-1',
        title: 'Delete unused Elastic IPs',
        description: '3 Elastic IPs are not attached to any instance',
        savings: 10.80,
        impact: 'low',
    },
    {
        id: 'rec-2',
        title: 'Right-size EC2 instances',
        description: '2 instances have low CPU utilization (<10%)',
        savings: 180.00,
        impact: 'medium',
    },
    {
        id: 'rec-3',
        title: 'Delete unattached EBS volumes',
        description: '5 volumes are not attached to any instance',
        savings: 125.00,
        impact: 'low',
    },
    {
        id: 'rec-4',
        title: 'Use Reserved Instances',
        description: 'Save up to 40% on EC2 with 1-year commitment',
        savings: 580.00,
        impact: 'high',
    },
];

const RESOURCE_ICONS: Record<string, typeof Server> = {
    EC2: Server,
    RDS: Database,
    EBS: HardDrive,
    EIP: Network,
    NAT: Network,
};

export function CostBreakdownPage() {
    const [timeRange, setTimeRange] = useState('6m');
    const totalCost = SERVICE_COSTS.reduce((sum, s) => sum + s.cost, 0);
    const potentialSavings = COST_RECOMMENDATIONS.reduce((sum, r) => sum + r.savings, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Cost Breakdown</h1>
                    <p className="text-muted-foreground">
                        Analyze your AWS spending and find optimization opportunities
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Last 6 months
                    </Button>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Month</p>
                                <p className="text-3xl font-bold">${totalCost.toLocaleString()}</p>
                                <div className="flex items-center gap-1 mt-1 text-sm text-green-500">
                                    <TrendingDown className="w-4 h-4" />
                                    <span>5.8% vs last month</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Forecasted</p>
                                <p className="text-3xl font-bold">$3,800</p>
                                <div className="flex items-center gap-1 mt-1 text-sm text-amber-500">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>3.8% increase expected</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <BarChart2 className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">YTD Total</p>
                                <p className="text-3xl font-bold">$21,980</p>
                                <p className="text-sm text-muted-foreground mt-1">Jan - Jan</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <PieChart className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Potential Savings</p>
                                <p className="text-3xl font-bold text-green-500">${potentialSavings.toFixed(0)}</p>
                                <p className="text-sm text-muted-foreground mt-1">{COST_RECOMMENDATIONS.length} recommendations</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingDown className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Cost Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Cost Trend</CardTitle>
                            <Tabs value={timeRange} onValueChange={setTimeRange}>
                                <TabsList className="h-8">
                                    <TabsTrigger value="3m" className="text-xs h-6">3M</TabsTrigger>
                                    <TabsTrigger value="6m" className="text-xs h-6">6M</TabsTrigger>
                                    <TabsTrigger value="1y" className="text-xs h-6">1Y</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={MONTHLY_COSTS}>
                                <defs>
                                    <linearGradient id="colorCostGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                                <YAxis stroke="var(--color-muted-foreground)" tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: number) => [`$${value}`, 'Cost']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="#6366f1"
                                    fillOpacity={1}
                                    fill="url(#colorCostGrad)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="#6366f1"
                                    strokeDasharray="5 5"
                                    fill="none"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Cost by Service */}
                <Card>
                    <CardHeader>
                        <CardTitle>By Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <RechartsPie>
                                <Pie
                                    data={SERVICE_COSTS}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="cost"
                                >
                                    {SERVICE_COSTS.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value}`} />
                            </RechartsPie>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-4">
                            {SERVICE_COSTS.slice(0, 4).map((service) => (
                                <div key={service.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: service.color }}
                                        />
                                        <span className="text-sm">{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">${service.cost}</span>
                                        <span className={`text-xs ${service.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {service.change > 0 ? '+' : ''}{service.change}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resource Costs & Recommendations */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Resource Costs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Top Resource Costs</CardTitle>
                            <Button variant="ghost" size="sm">View All</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {RESOURCE_COSTS.map((resource) => {
                                const Icon = RESOURCE_ICONS[resource.type] || Server;
                                return (
                                    <div key={resource.id} className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">{resource.name}</span>
                                                {resource.alert && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {resource.alert}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {resource.id}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">${resource.cost.toFixed(2)}</div>
                                            <div className={`text-xs flex items-center justify-end gap-1 ${resource.change > 0 ? 'text-red-500' : resource.change < 0 ? 'text-green-500' : 'text-muted-foreground'
                                                }`}>
                                                {resource.change > 0 ? <ChevronUp className="w-3 h-3" /> :
                                                    resource.change < 0 ? <ChevronDown className="w-3 h-3" /> : null}
                                                {resource.change !== 0 ? `${Math.abs(resource.change)}%` : 'Stable'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Recommendations */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Optimization Recommendations</CardTitle>
                            <Badge variant="secondary">${potentialSavings.toFixed(0)}/mo</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {COST_RECOMMENDATIONS.map((rec) => (
                                <div
                                    key={rec.id}
                                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{rec.title}</h4>
                                                <Badge
                                                    variant={rec.impact === 'high' ? 'default' : rec.impact === 'medium' ? 'secondary' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {rec.impact}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className="text-lg font-bold text-green-500">
                                                -${rec.savings.toFixed(0)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">/month</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

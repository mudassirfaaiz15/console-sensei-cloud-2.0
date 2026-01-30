import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Server, AlertTriangle, Shield } from 'lucide-react';

interface StatItem {
    id: string;
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ElementType;
    color: string;
}

interface QuickStatsBarProps {
    totalResources?: number;
    criticalAlerts?: number;
    monthlyCost?: number;
    hygieneScore?: number;
}

export function QuickStatsBar({
    totalResources = 0,
    criticalAlerts = 0,
    monthlyCost = 0,
    hygieneScore = 0,
}: QuickStatsBarProps) {
    const stats: StatItem[] = useMemo(
        () => [
            {
                id: 'resources',
                label: 'Total Resources',
                value: totalResources,
                change: 2,
                changeLabel: 'from last scan',
                icon: Server,
                color: 'text-primary',
            },
            {
                id: 'alerts',
                label: 'Critical Alerts',
                value: criticalAlerts,
                change: criticalAlerts > 0 ? 1 : 0,
                changeLabel: 'need attention',
                icon: AlertTriangle,
                color: criticalAlerts > 0 ? 'text-red-500' : 'text-green-500',
            },
            {
                id: 'cost',
                label: 'Monthly Cost',
                value: `$${monthlyCost.toFixed(0)}`,
                change: -5,
                changeLabel: 'vs last month',
                icon: DollarSign,
                color: 'text-emerald-500',
            },
            {
                id: 'score',
                label: 'Hygiene Score',
                value: `${hygieneScore}/100`,
                change: 3,
                changeLabel: 'improvement',
                icon: Shield,
                color: hygieneScore >= 70 ? 'text-green-500' : hygieneScore >= 50 ? 'text-amber-500' : 'text-red-500',
            },
        ],
        [totalResources, criticalAlerts, monthlyCost, hygieneScore]
    );

    const getTrendIcon = (change: number | undefined) => {
        if (change === undefined) return null;
        if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
        if (change < 0) return <TrendingDown className="w-3 h-3 text-green-500" />;
        return null;
    };

    return (
        <div className="bg-card/50 border-b border-border backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div key={stat.id} className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold truncate">{stat.value}</span>
                                        {getTrendIcon(stat.change)}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

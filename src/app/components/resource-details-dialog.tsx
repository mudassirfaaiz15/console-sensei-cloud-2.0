import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import {
    Server,
    HardDrive,
    Wifi,
    Database,
    Network,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Copy,
    RefreshCw,
    Trash2,
    Clock,
    Globe,
    DollarSign,
} from 'lucide-react';
import type { Resource, ResourceStatus } from '@/types';
import { notifications } from '@/lib/notifications';

interface ResourceDetailsDialogProps {
    resource: Resource | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const RESOURCE_ICONS: Record<string, typeof Server> = {
    ec2: Server,
    ebs: HardDrive,
    eip: Wifi,
    rds: Database,
    nat: Network,
    s3: HardDrive,
};

const STATUS_CONFIGS: Record<ResourceStatus, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
    safe: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        label: 'Healthy',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        label: 'Needs Attention',
    },
    critical: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        label: 'Critical',
    },
};

// Mock data for additional resource details
const getResourceDetails = (resource: Resource) => ({
    arn: `arn:aws:${resource.type}:${resource.region || 'us-east-1'}:123456789012:${resource.id}`,
    createdAt: '2024-01-15T10:30:00Z',
    lastModified: '2024-01-28T14:22:00Z',
    monthlyCost: resource.status === 'critical' ? 15.60 : resource.status === 'warning' ? 8.20 : 0,
    tags: [
        { key: 'Environment', value: 'Production' },
        { key: 'Owner', value: 'DevOps Team' },
        { key: 'Project', value: 'ConsoleSensei' },
    ],
    metrics: {
        usage: resource.status === 'safe' ? 75 : resource.status === 'warning' ? 45 : 12,
        uptime: 99.95,
        lastActive: '5 minutes ago',
    },
});

export function ResourceDetailsDialog({ resource, open, onOpenChange }: ResourceDetailsDialogProps) {
    if (!resource) return null;

    const ResourceIcon = RESOURCE_ICONS[resource.type || 'ec2'] || Server;
    const statusConfig = STATUS_CONFIGS[resource.status];
    const StatusIcon = statusConfig.icon;
    const details = getResourceDetails(resource);

    const handleCopyArn = () => {
        navigator.clipboard.writeText(details.arn);
        notifications.success('Copied!', 'ARN copied to clipboard');
    };

    const handleRefresh = () => {
        notifications.info('Refreshing...', 'Fetching latest resource data');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
                            <ResourceIcon className={`w-6 h-6 ${statusConfig.color}`} />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl">{resource.name}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`${statusConfig.color} border-current`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig.label}
                                </Badge>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-mono text-xs">{resource.id}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs">Monthly Cost</span>
                            </div>
                            <div className="text-2xl font-bold">
                                ${details.monthlyCost.toFixed(2)}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Globe className="w-4 h-4" />
                                <span className="text-xs">Region</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {resource.region || 'us-east-1'}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs">Uptime</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {details.metrics.uptime}%
                            </div>
                        </div>
                    </div>

                    {/* ARN */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Resource ARN
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 rounded-lg bg-muted font-mono text-xs truncate">
                                {details.arn}
                            </code>
                            <Button variant="outline" size="icon" onClick={handleCopyArn}>
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Usage Metrics */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Current Usage
                        </label>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Utilization</span>
                                <span className="font-medium">{details.metrics.usage}%</span>
                            </div>
                            <Progress value={details.metrics.usage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                Last active: {details.metrics.lastActive}
                            </p>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Resource Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {details.tags.map((tag) => (
                                <Badge key={tag.key} variant="secondary" className="font-mono text-xs">
                                    {tag.key}: {tag.value}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Created:</span>
                            <span className="ml-2 font-medium">
                                {new Date(details.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Last Modified:</span>
                            <span className="ml-2 font-medium">
                                {new Date(details.lastModified).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleRefresh}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open in AWS
                            </Button>
                        </div>
                        {resource.status === 'critical' && (
                            <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Resource
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

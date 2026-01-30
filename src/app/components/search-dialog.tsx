import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    Search,
    Filter,
    Server,
    HardDrive,
    Wifi,
    Database,
    Network,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    X,
} from 'lucide-react';
import type { Resource, ResourceStatus, ResourceType } from '@/types';

interface SearchDialogProps {
    resources: Resource[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResourceSelect: (resource: Resource) => void;
}

const RESOURCE_ICONS: Record<string, typeof Server> = {
    ec2: Server,
    ebs: HardDrive,
    eip: Wifi,
    rds: Database,
    nat: Network,
    s3: HardDrive,
};

const STATUS_COLORS: Record<ResourceStatus, string> = {
    safe: 'text-green-500',
    warning: 'text-amber-500',
    critical: 'text-red-500',
};

const STATUS_ICONS: Record<ResourceStatus, typeof CheckCircle2> = {
    safe: CheckCircle2,
    warning: AlertTriangle,
    critical: XCircle,
};

type FilterType = 'all' | ResourceStatus | ResourceType;

export function SearchDialog({ resources, open, onOpenChange, onResourceSelect }: SearchDialogProps) {
    const [search, setSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

    // Filter and search resources
    const filteredResources = useMemo(() => {
        let result = resources;

        // Apply status/type filters
        if (activeFilters.length > 0 && !activeFilters.includes('all')) {
            result = result.filter(
                (r) => activeFilters.includes(r.status) || activeFilters.includes(r.type as ResourceType)
            );
        }

        // Apply search
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
                (r) =>
                    r.name.toLowerCase().includes(searchLower) ||
                    r.id.toLowerCase().includes(searchLower) ||
                    r.description.toLowerCase().includes(searchLower)
            );
        }

        return result;
    }, [resources, search, activeFilters]);

    const toggleFilter = (filter: FilterType) => {
        if (filter === 'all') {
            setActiveFilters([]);
            return;
        }
        setActiveFilters((prev) =>
            prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
        );
    };

    const clearFilters = () => {
        setActiveFilters([]);
        setSearch('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="text-lg">Search Resources</DialogTitle>
                </DialogHeader>

                {/* Search Input */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border-0 outline-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Button
                            variant={activeFilters.length === 0 ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleFilter('all')}
                        >
                            All
                        </Button>
                        <div className="w-px h-4 bg-border" />
                        <Button
                            variant={activeFilters.includes('critical') ? 'destructive' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleFilter('critical')}
                        >
                            <XCircle className="w-3 h-3 mr-1" />
                            Critical
                        </Button>
                        <Button
                            variant={activeFilters.includes('warning') ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleFilter('warning')}
                        >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Warning
                        </Button>
                        <Button
                            variant={activeFilters.includes('safe') ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleFilter('safe')}
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Safe
                        </Button>
                        <div className="w-px h-4 bg-border" />
                        {['ec2', 'ebs', 's3', 'rds'].map((type) => {
                            const Icon = RESOURCE_ICONS[type] || Server;
                            return (
                                <Button
                                    key={type}
                                    variant={activeFilters.includes(type as ResourceType) ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-7 text-xs uppercase"
                                    onClick={() => toggleFilter(type as ResourceType)}
                                >
                                    <Icon className="w-3 h-3 mr-1" />
                                    {type}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Active Filters */}
                {activeFilters.length > 0 && (
                    <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Active filters:</span>
                        {activeFilters.map((filter) => (
                            <Badge
                                key={filter}
                                variant="secondary"
                                className="cursor-pointer hover:bg-destructive/20"
                                onClick={() => toggleFilter(filter)}
                            >
                                {filter}
                                <X className="w-3 h-3 ml-1" />
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                            Clear all
                        </Button>
                    </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredResources.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No resources found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground mb-3">
                                {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
                            </p>
                            {filteredResources.map((resource) => {
                                const ResourceIcon = RESOURCE_ICONS[resource.type || 'ec2'] || Server;
                                const StatusIcon = STATUS_ICONS[resource.status];

                                return (
                                    <button
                                        key={resource.id}
                                        onClick={() => {
                                            onResourceSelect(resource);
                                            onOpenChange(false);
                                        }}
                                        className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                                            <ResourceIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">{resource.name}</span>
                                                <StatusIcon className={`w-4 h-4 ${STATUS_COLORS[resource.status]}`} />
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono">{resource.id}</span>
                                                <span>•</span>
                                                <span>{resource.description}</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="uppercase text-xs">
                                            {resource.type || 'ec2'}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

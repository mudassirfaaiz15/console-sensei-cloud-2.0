import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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
  Activity,
  RefreshCw,
  Download,
  Bell,
  Loader2,
  Search,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useResources, useAlerts, useActivities, useCostData, useHygieneScore, useRunScan } from '@/hooks/use-aws-data';
import { CardSkeleton, ChartSkeleton, AlertSkeleton, ActivitySkeleton } from '@/app/components/ui/skeleton';
import { ResourceDetailsDialog } from '@/app/components/resource-details-dialog';
import { SearchDialog } from '@/app/components/search-dialog';
import { OnboardingTour, useOnboarding } from '@/app/components/onboarding-tour';
import { generateSummaryReport } from '@/lib/pdf-export';
import { notifications } from '@/lib/notifications';
import type { Resource, ResourceStatus, AlertType } from '@/types';

// Icon mapping for resource types
const RESOURCE_ICONS: Record<string, typeof Server> = {
  ec2: Server,
  ebs: HardDrive,
  eip: Wifi,
  rds: Database,
  nat: Network,
  s3: HardDrive,
};

// Status styling maps
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

const ALERT_STYLES: Record<AlertType, string> = {
  critical: 'border-red-500/50 bg-red-500/5',
  warning: 'border-amber-500/50 bg-amber-500/5',
  info: 'border-blue-500/50 bg-blue-500/5',
};

const ALERT_ICONS: Record<AlertType, typeof XCircle> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Activity,
};

const ALERT_COLORS: Record<AlertType, string> = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function DashboardPage() {
  // State for dialogs
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // Onboarding
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // React Query hooks
  const { data: resources, isLoading: resourcesLoading } = useResources();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: activities, isLoading: activitiesLoading } = useActivities(4);
  const { data: costData, isLoading: costLoading } = useCostData(6);
  const { data: hygieneScore, isLoading: hygieneLoading } = useHygieneScore();
  const runScan = useRunScan();

  const handleRunScan = async () => {
    try {
      const result = await runScan.mutateAsync();
      notifications.scanComplete(result.resourcesScanned);
    } catch {
      notifications.error('Scan failed', 'Please try again later.');
    }
  };

  const handleExportReport = async () => {
    if (!hygieneScore || !resources || !alerts) return;

    try {
      await generateSummaryReport({
        title: 'AWS Infrastructure Report',
        generatedAt: new Date(),
        hygieneScore: hygieneScore.overall,
        totalResources: resources.length,
        criticalAlerts: alerts.filter(a => a.type === 'critical').length,
        monthlyCost: costData?.[costData.length - 1]?.cost || 0,
        recommendations: hygieneScore.recommendations,
      });
      notifications.exportSuccess('aws-infrastructure-report.pdf');
    } catch {
      notifications.error('Export failed', 'Could not generate PDF.');
    }
  };

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceDialogOpen(true);
  };

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceDialogOpen(true);
    setSearchDialogOpen(false);
  };

  return (
    <>
      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}

      <div id="dashboard-content" className="p-6 space-y-6">
        {/* Header */}
        <div data-tour="dashboard-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your AWS overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              aria-label="Search resources"
              onClick={() => setSearchDialogOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" aria-hidden="true" />
              Search
              <kbd className="ml-2 hidden sm:inline-block px-1.5 py-0.5 text-xs bg-muted rounded">
                Ctrl+F
              </kbd>
            </Button>
            <Button
              variant="outline"
              aria-label="Export dashboard report"
              onClick={handleExportReport}
              disabled={hygieneLoading || !hygieneScore}
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Export
            </Button>
            <Button
              aria-label="Run new AWS scan"
              onClick={handleRunScan}
              disabled={runScan.isPending}
            >
              {runScan.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              )}
              {runScan.isPending ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
        </div>

        {/* Cloud Hygiene Score */}
        <div data-tour="hygiene-score">
          {hygieneLoading ? (
            <CardSkeleton />
          ) : hygieneScore ? (
            <Card className="border-border bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle>Cloud Hygiene Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <div
                      className="w-32 h-32 rounded-full border-8 border-warning/20 flex items-center justify-center"
                      role="meter"
                      aria-valuenow={hygieneScore.overall}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Cloud hygiene score"
                    >
                      <div className="text-center">
                        <div className="text-4xl font-bold text-warning">{hygieneScore.overall}</div>
                        <div className="text-sm text-muted-foreground">/100</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Security</span>
                        <span className="text-sm text-muted-foreground">{hygieneScore.security}%</span>
                      </div>
                      <Progress value={hygieneScore.security} className="h-2" aria-label={`Security score ${hygieneScore.security}%`} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cost Efficiency</span>
                        <span className="text-sm text-muted-foreground">{hygieneScore.costEfficiency}%</span>
                      </div>
                      <Progress value={hygieneScore.costEfficiency} className="h-2" aria-label={`Cost efficiency score ${hygieneScore.costEfficiency}%`} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Best Practices</span>
                        <span className="text-sm text-muted-foreground">{hygieneScore.bestPractices}%</span>
                      </div>
                      <Progress value={hygieneScore.bestPractices} className="h-2" aria-label={`Best practices score ${hygieneScore.bestPractices}%`} />
                    </div>
                  </div>
                </div>
                {hygieneScore.criticalIssues > 0 && (
                  <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">Attention Needed</p>
                        <p className="text-muted-foreground mt-1">
                          {hygieneScore.criticalIssues} critical issue{hygieneScore.criticalIssues > 1 ? 's' : ''} detected. {hygieneScore.recommendations[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Resource Metrics */}
        <div data-tour="resources" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resourcesLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            resources?.map((resource) => {
              const StatusIcon = STATUS_ICONS[resource.status];
              const ResourceIcon = RESOURCE_ICONS[resource.type || 'ec2'] || Server;

              return (
                <Card
                  key={resource.id}
                  className="border-border hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => handleResourceClick(resource)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <ResourceIcon className="w-6 h-6 text-primary" aria-hidden="true" />
                      </div>
                      <StatusIcon
                        className={`w-5 h-5 ${STATUS_COLORS[resource.status]}`}
                        aria-label={`Status: ${resource.status}`}
                      />
                    </div>
                    <div className="text-3xl font-bold mb-1">{resource.value}</div>
                    <div className="text-sm font-medium mb-1">{resource.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {resource.description}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Cost Chart */}
        {costLoading ? (
          <ChartSkeleton />
        ) : (
          <Card className="border-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Monthly Costs</CardTitle>
                <Badge variant="outline">Last 6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costData}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Risk Alerts */}
          <div data-tour="alerts">
            <Card className="border-border h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Risk Alerts</CardTitle>
                  <Button variant="ghost" size="sm" aria-label="Configure alert settings">
                    <Bell className="w-4 h-4 mr-2" aria-hidden="true" />
                    Configure
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-4">
                    <AlertSkeleton />
                    <AlertSkeleton />
                    <AlertSkeleton />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts?.map((alert) => {
                      const AlertIcon = ALERT_ICONS[alert.type];

                      return (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border ${ALERT_STYLES[alert.type]}`}
                        >
                          <div className="flex gap-3">
                            <AlertIcon
                              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ALERT_COLORS[alert.type]}`}
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{alert.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {alert.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {alert.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-border h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  <ActivitySkeleton />
                  <ActivitySkeleton />
                  <ActivitySkeleton />
                </div>
              ) : (
                <div className="space-y-4">
                  {activities?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                        <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {activity.resource}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{activity.time}</span>
                          <span aria-hidden="true">•</span>
                          <span>{activity.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resource Details Dialog */}
      <ResourceDetailsDialog
        resource={selectedResource}
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
      />

      {/* Search Dialog */}
      <SearchDialog
        resources={resources || []}
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onResourceSelect={handleResourceSelect}
      />
    </>
  );
}

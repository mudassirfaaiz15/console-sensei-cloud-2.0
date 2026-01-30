import { cn } from '@/app/components/ui/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}

// Card Skeleton for dashboard metrics
export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>
      <Skeleton className="h-9 w-12 mb-2" />
      <Skeleton className="h-5 w-32 mb-1" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="h-[300px] flex items-end justify-between gap-2 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={`chart-bar-${i}`}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Alert Skeleton
export function AlertSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border">
      <div className="flex gap-3">
        <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

// Activity Skeleton
export function ActivitySkeleton() {
  return (
    <div className="flex gap-4 py-4">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={`table-cell-${i}`} className="p-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
}

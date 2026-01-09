import { cn } from "@/lib/utils";

export interface WidgetSkeletonProps {
  className?: string;
  lines?: number;
}

export function WidgetSkeleton({ className, lines = 3 }: WidgetSkeletonProps) {
  return (
    <div className={cn("widget rounded-lg border bg-card", className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-muted animate-pulse rounded" />
            <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export interface WidgetSkeletonProps {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	lines?: number;
}

export function WidgetSkeleton({
	className,
	headerClassName,
	contentClassName,
	lines = 3,
}: WidgetSkeletonProps) {
	return (
		<div className={cn("widget rounded-lg border bg-card", className)}>
			{/* Header skeleton */}
			<div
				className={cn(
					"flex items-center justify-between px-4 py-3 border-b",
					headerClassName,
				)}
			>
				<div className="h-4 w-24 bg-muted animate-pulse rounded" />
				<div className="h-4 w-4 bg-muted animate-pulse rounded" />
			</div>

			{/* Content skeleton */}
			<div className={cn("p-4 space-y-3", contentClassName)}>
				{Array.from({ length: lines }).map((_, i) => (
					<div key={`skeleton-${i}`} className="space-y-2">
						<div className="h-3 bg-muted animate-pulse rounded" />
						<div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

import { cn } from "@/lib/utils";

export type WidgetLoadingStateVariant = "list" | "card" | "tag";

export interface WidgetLoadingStateProps {
	className?: string;
	lines?: number;
	variant?: WidgetLoadingStateVariant;
}

export function WidgetLoadingState({
	className,
	lines = 3,
	variant = "list",
}: WidgetLoadingStateProps) {
	return (
		<div className={cn("space-y-3 animate-pulse", className)}>
			{variant === "list" && (
				<>
					{Array.from({ length: lines }).map((_, i) => (
						<div key={`skeleton-list-${i}`} className="space-y-2">
							<div className="h-3 bg-muted rounded" />
							<div className="h-3 w-3/4 bg-muted rounded" />
						</div>
					))}
				</>
			)}
			{variant === "tag" && (
				<div className="flex flex-wrap gap-2">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={`skeleton-tag-${i}`}
							className="h-6 w-16 bg-muted rounded"
						/>
					))}
				</div>
			)}
			{variant === "card" && (
				<>
					{Array.from({ length: lines }).map((_, i) => (
						<div
							key={`skeleton-card-${i}`}
							className="h-20 bg-muted rounded"
						/>
					))}
				</>
			)}
		</div>
	);
}

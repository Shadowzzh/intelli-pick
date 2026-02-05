export function MetricItemSkeleton() {
	return (
		<div className="flex items-center justify-between px-6 py-5 motion-safe:animate-pulse">
			{/* 左侧：图标和标签占位 */}
			<div className="flex items-center gap-3">
				<div className="size-4 bg-muted-foreground/20 rounded" />
				<div className="h-4 bg-muted-foreground/20 rounded w-16" />
			</div>

			{/* 右侧：数值占位 */}
			<div className="h-4 bg-muted-foreground/20 rounded w-24" />
		</div>
	);
}

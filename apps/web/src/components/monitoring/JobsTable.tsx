// apps/web/src/components/monitoring/JobsTable.tsx
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueJob } from "@intellipick/shared";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useRef } from "react";

interface JobsTableProps {
	jobs: QueueJob[];
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	onJobClick: (job: QueueJob) => void;
	onLoadMore: () => void;
}

export function JobsTable({
	jobs,
	isLoading,
	isLoadingMore,
	hasMore,
	onJobClick,
	onLoadMore,
}: JobsTableProps) {
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const getStatusBadge = (job: QueueJob) => {
		let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
		let colorClass = "";

		if (job.failedReason) {
			variant = "destructive";
			colorClass = "bg-red-500/10 text-red-700";
		} else if (job.finishedOn) {
			colorClass = "bg-green-500/10 text-green-700";
		} else if (job.processedOn) {
			colorClass = "bg-orange-500/10 text-orange-700";
		} else {
			colorClass = "bg-blue-500/10 text-blue-700";
		}

		let statusLabel = "等待中";
		if (job.failedReason) statusLabel = "失败";
		else if (job.finishedOn) statusLabel = "已完成";
		else if (job.processedOn) statusLabel = "处理中";

		return (
			<Badge variant={variant} className={colorClass}>
				{statusLabel}
			</Badge>
		);
	};

	// 设置 Intersection Observer
	if (typeof window !== "undefined" && loadMoreRef.current) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					onLoadMore();
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(loadMoreRef.current);

		return () => observer.disconnect();
	}

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="p-4 border-b">
						<Skeleton className="h-16 w-full" />
					</div>
				))}
			</div>
		);
	}

	if (jobs.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				暂无符合条件的任务
			</div>
		);
	}

	return (
		<div className="w-full">
			{/* 表头 */}
			<div className="grid grid-cols-[120px_100px_1fr_160px_80px] gap-2 px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
				<div>任务ID</div>
				<div>状态</div>
				<div>数据摘要</div>
				<div>创建时间</div>
				<div>操作</div>
			</div>

			{/* 表格内容 */}
			<div className="divide-y">
				{jobs.map((job) => (
					<div
						key={job.id}
						onClick={() => onJobClick(job)}
						className="grid grid-cols-[120px_100px_1fr_160px_80px] gap-2 px-4 py-3 hover:bg-accent/50 cursor-pointer items-center"
					>
						{/* 任务ID */}
						<div className="text-xs font-mono truncate" title={job.id || undefined}>
							{job.id?.slice(0, 8) || "N/A"}
						</div>

						{/* 状态 */}
						<div>{getStatusBadge(job)}</div>

						{/* 数据摘要 */}
						<div className="text-sm truncate">
							{job.data ? JSON.stringify(job.data).slice(0, 100) : "N/A"}
						</div>

						{/* 创建时间 */}
						<div className="text-xs text-muted-foreground">
							{job.timestamp
								? formatDistanceToNow(new Date(job.timestamp), {
										addSuffix: true,
										locale: zhCN,
								  })
								: "N/A"}
						</div>

						{/* 操作 */}
						<div>
							<button
								className="text-xs text-primary hover:underline"
								onClick={(e) => {
									e.stopPropagation();
									onJobClick(job);
								}}
							>
								详情
							</button>
						</div>
					</div>
				))}
			</div>

			{/* 加载更多触发器 */}
			<div ref={loadMoreRef} className="py-4 text-center text-sm text-muted-foreground">
				{isLoadingMore && "🔄 加载更多..."}
				{!hasMore && jobs.length > 0 && "✅ 已加载全部任务"}
			</div>
		</div>
	);
}

// apps/web/src/components/monitoring/JobsTable.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QueueJob } from "@intellipick/shared";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	CheckCircle2,
	CircleDashed,
	Eye,
	LoaderCircle,
	XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

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
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	// 当进入视口且还有更多数据时，触发加载
	useEffect(() => {
		if (inView && hasMore && !isLoadingMore) {
			onLoadMore();
		}
	}, [inView, hasMore, isLoadingMore, onLoadMore]);

	const getStatusBadge = (job: QueueJob) => {
		let variant: "outline" | "success" | "warning" | "error" = "outline";
		let icon = <CircleDashed className="size-3.5" />;

		if (job.failedReason) {
			variant = "error";
			icon = <XCircle className="size-3.5" />;
		} else if (job.finishedOn) {
			variant = "success";
			icon = <CheckCircle2 className="size-3.5" />;
		} else if (job.processedOn) {
			variant = "warning";
			icon = <LoaderCircle className="size-3.5 animate-spin" />;
		}

		let statusLabel = "等待中";
		if (job.failedReason) statusLabel = "失败";
		else if (job.finishedOn) statusLabel = "已完成";
		else if (job.processedOn) statusLabel = "处理中";

		return (
			<Badge variant={variant} className="gap-1.5">
				{icon}
				<span>{statusLabel}</span>
			</Badge>
		);
	};

	if (isLoading) {
		return (
			<div className="space-y-3 p-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="animate-pulse">
						<div className="h-20 bg-muted rounded-lg" />
					</div>
				))}
			</div>
		);
	}

	if (jobs.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="text-lg font-medium text-muted-foreground">
					暂无符合条件的任务
				</div>
				<div className="text-sm text-muted-foreground mt-1">
					尝试切换状态筛选器查看其他任务
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			{/* 表格内容 */}
			<div className="divide-y">
				{jobs.map((job) => (
					<div
						key={job.id}
						className="grid grid-cols-[140px_120px_1fr_180px_120px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50"
					>
						{/* 任务ID */}
						<div className="flex flex-col">
							<div
								className="text-xs font-mono font-medium truncate"
								title={job.id || undefined}
							>
								{job.id?.slice(0, 8) || "N/A"}
							</div>
							{job.attemptsMade > 0 && (
								<div className="text-xs text-muted-foreground mt-0.5">
									重试 {job.attemptsMade} 次
								</div>
							)}
						</div>

						{/* 状态 */}
						<div>{getStatusBadge(job)}</div>

						{/* 数据摘要 */}
						<div className="text-sm truncate text-muted-foreground">
							{job.data ? JSON.stringify(job.data).slice(0, 80) : "N/A"}
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
							<Button
								type="button"
								size="sm"
								className="cursor-pointer"
								title="查看任务详情"
								onClick={(e) => {
									e.stopPropagation();
									onJobClick(job);
								}}
							>
								<Eye />
								任务详情
							</Button>
						</div>
					</div>
				))}
			</div>

			{/* 加载更多触发器 */}
			<div ref={loadMoreRef} className="py-6 text-center">
				{isLoadingMore && (
					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<LoaderCircle className="size-4 animate-spin" />
						<span>加载更多...</span>
					</div>
				)}
				{!hasMore && jobs.length > 0 && (
					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<CheckCircle2 className="size-4" />
						<span>已加载全部任务</span>
					</div>
				)}
			</div>
		</div>
	);
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Widget } from "@/components/widgets/Widget";
import { useJobHistory } from "@/hooks/useJobHistory";
import type { JobHistoryRecord, JobHistoryStatus } from "@intellipick/shared";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Eye,
	History,
	LoaderCircle,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { JobHistoryDetailDialog } from "./JobHistoryDetailDialog";

type HistoryFilter = JobHistoryStatus | "all";

function isHistoryFilter(value: string): value is HistoryFilter {
	return value === "all" || value === "completed" || value === "failed";
}

function formatDuration(duration: number | null): string {
	if (duration === null) return "未记录";
	if (duration < 1000) return `${duration} ms`;
	return `${(duration / 1000).toFixed(1)} s`;
}

export function JobHistoryWidget() {
	const [status, setStatus] = useState<HistoryFilter>("all");
	const [page, setPage] = useState(1);
	const [selectedRecord, setSelectedRecord] = useState<JobHistoryRecord | null>(
		null,
	);
	const limit = 10;
	const queryStatus = status === "all" ? undefined : status;
	const { data, isLoading, isFetching, isError } = useJobHistory({
		page,
		limit,
		status: queryStatus,
	});
	const records = data?.data || [];
	const totalPages = data?.meta.totalPages || 0;

	const handleStatusChange = (value: string) => {
		if (!isHistoryFilter(value)) return;
		setStatus(value);
		setPage(1);
	};

	return (
		<>
			<Widget
				title="执行历史"
				icon={<History className="size-4" />}
				contentClassName="p-0"
				actions={
					<Select value={status} onValueChange={handleStatusChange}>
						<SelectTrigger className="h-8 w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部</SelectItem>
							<SelectItem value="completed">已完成</SelectItem>
							<SelectItem value="failed">失败</SelectItem>
						</SelectContent>
					</Select>
				}
			>
				{isLoading && (
					<div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
						<LoaderCircle className="size-4 animate-spin" />
						加载执行历史
					</div>
				)}

				{isError && (
					<div className="flex h-40 items-center justify-center text-sm text-destructive">
						执行历史加载失败，请检查数据库迁移状态。
					</div>
				)}

				{!isLoading && !isError && records.length === 0 && (
					<div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
						暂无执行历史
					</div>
				)}

				{records.length > 0 && (
					<div className="overflow-x-auto">
						<div className="min-w-[680px]">
							<div className="grid grid-cols-[140px_100px_1fr_110px_130px_40px] gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
								<div>任务 ID</div>
								<div>状态</div>
								<div>来源</div>
								<div>耗时</div>
								<div>完成时间</div>
								<div />
							</div>
							<div className="divide-y">
								{records.map((record) => (
									<div
										key={record.id}
										className="grid grid-cols-[140px_100px_1fr_110px_130px_40px] items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
									>
										<div
											className="truncate font-mono text-xs"
											title={record.jobId}
										>
											{record.jobId.slice(0, 14)}
										</div>
										<div>
											<Badge
												variant={
													record.status === "failed" ? "error" : "success"
												}
												className="gap-1"
											>
												{record.status === "failed" ? (
													<XCircle className="size-3.5" />
												) : (
													<CheckCircle2 className="size-3.5" />
												)}
												{record.status === "failed" ? "失败" : "完成"}
											</Badge>
										</div>
										<div className="truncate text-sm text-muted-foreground">
											{record.sourceType || "未知来源"}
										</div>
										<div className="text-xs text-muted-foreground">
											{formatDuration(record.duration)}
										</div>
										<div className="text-xs text-muted-foreground">
											{formatDistanceToNow(new Date(record.finishedAt), {
												addSuffix: true,
												locale: zhCN,
											})}
										</div>
										<Button
											variant="ghost"
											size="icon-sm"
											title="查看执行历史详情"
											onClick={(event) => {
												event.stopPropagation();
												setSelectedRecord(record);
											}}
										>
											<Eye />
										</Button>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{data && data.meta.totalPages > 1 && (
					<div className="flex items-center justify-between border-t px-4 py-3">
						<span className="text-xs text-muted-foreground">
							第 {page} / {totalPages} 页，共 {data.meta.total} 条
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon-sm"
								title="上一页"
								disabled={page <= 1 || isFetching}
								onClick={() => setPage((current) => Math.max(1, current - 1))}
							>
								<ChevronLeft />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								title="下一页"
								disabled={page >= totalPages || isFetching}
								onClick={() => setPage((current) => current + 1)}
							>
								<ChevronRight />
							</Button>
						</div>
					</div>
				)}
			</Widget>

			<JobHistoryDetailDialog
				record={selectedRecord}
				open={selectedRecord !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedRecord(null);
				}}
			/>
		</>
	);
}

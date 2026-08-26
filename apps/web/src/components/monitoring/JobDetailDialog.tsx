import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useJobDetail } from "@/hooks/useQueueJobs";
import type { QueueJobDetail } from "@intellipick/shared";
import { format } from "date-fns";
import {
	AlertCircle,
	CheckCircle2,
	Clock3,
	ExternalLink,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { JobHistoryDetailContent } from "./JobHistoryDetailDialog";

interface JobDetailDialogProps {
	jobId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function formatTimestamp(value: number | undefined): string {
	if (!value) return "未记录";
	return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
}

function LiveJobDetail({ job }: { job: QueueJobDetail }) {
	return (
		<div className="space-y-5">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<div className="mb-1 text-xs text-muted-foreground">任务 ID</div>
					<Badge variant="outline">{job.id || "N/A"}</Badge>
				</div>
				<div>
					<div className="mb-1 text-xs text-muted-foreground">尝试次数</div>
					<Badge variant="secondary">{job.attemptsMade}</Badge>
				</div>
			</div>

			<div className="space-y-2">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<Clock3 className="size-4" />
					时间线
				</h3>
				<div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
					<div>
						<span className="text-muted-foreground">创建：</span>
						{formatTimestamp(job.timestamp)}
					</div>
					<div>
						<span className="text-muted-foreground">开始：</span>
						{formatTimestamp(job.processedOn)}
					</div>
					<div>
						<span className="text-muted-foreground">结束：</span>
						{formatTimestamp(job.finishedOn)}
					</div>
				</div>
			</div>

			{job.failedReason && (
				<div className="space-y-2">
					<h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
						<XCircle className="size-4" />
						失败原因
					</h3>
					<p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
						{job.failedReason}
					</p>
				</div>
			)}

			{job.stacktrace && job.stacktrace.length > 0 && (
				<div className="space-y-2">
					<h3 className="flex items-center gap-2 text-sm font-semibold">
						<AlertCircle className="size-4" />
						堆栈跟踪
					</h3>
					<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
						{job.stacktrace.join("\n")}
					</pre>
				</div>
			)}

			<div className="space-y-2">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<ExternalLink className="size-4" />
					任务数据
				</h3>
				<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
					{JSON.stringify(job.data, null, 2)}
				</pre>
			</div>

			{job.returnvalue !== undefined && (
				<div className="space-y-2">
					<h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
						<CheckCircle2 className="size-4" />
						返回值
					</h3>
					<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
						{JSON.stringify(job.returnvalue, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

export function JobDetailDialog({
	jobId,
	open,
	onOpenChange,
}: JobDetailDialogProps) {
	const {
		data: detail,
		isLoading,
		isError,
		isFetching,
		refetch,
	} = useJobDetail(jobId);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>任务详情</DialogTitle>
					<DialogDescription>
						自动读取实时队列；任务完成后自动切换到执行历史
					</DialogDescription>
				</DialogHeader>

				{isLoading && (
					<div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
						<Loader2 className="size-4 animate-spin" />
						正在查找任务详情...
					</div>
				)}

				{isError && (
					<div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
						<div className="flex items-center gap-2">
							<AlertCircle className="size-4" />
							实时队列和执行历史中都没有找到该任务。
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="cursor-pointer"
							onClick={() => refetch()}
						>
							<RefreshCw />
							重新获取
						</Button>
					</div>
				)}

				{detail && (
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Badge
								variant={detail.origin === "queue" ? "warning" : "secondary"}
							>
								{detail.origin === "queue" ? "实时队列" : "执行历史"}
							</Badge>
							{isFetching && <Loader2 className="size-4 animate-spin" />}
						</div>

						{detail.origin === "queue" ? (
							<LiveJobDetail job={detail.job} />
						) : (
							<JobHistoryDetailContent record={detail.record} />
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

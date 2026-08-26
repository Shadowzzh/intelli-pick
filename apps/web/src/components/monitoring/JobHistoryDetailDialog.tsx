import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { JobHistoryRecord } from "@intellipick/shared";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock3, ExternalLink } from "lucide-react";

interface JobHistoryDetailDialogProps {
	record: JobHistoryRecord | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function formatDuration(duration: number | null): string {
	if (duration === null) return "未记录";
	if (duration < 1000) return `${duration} ms`;
	return `${(duration / 1000).toFixed(2)} s`;
}

export function JobHistoryDetailContent({
	record,
}: {
	record: JobHistoryRecord;
}) {
	return (
		<div className="space-y-5">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div>
					<div className="mb-1 text-xs text-muted-foreground">任务 ID</div>
					<Badge variant="outline">{record.jobId}</Badge>
				</div>
				<div>
					<div className="mb-1 text-xs text-muted-foreground">状态</div>
					<Badge variant={record.status === "failed" ? "error" : "success"}>
						{record.status === "failed" ? "失败" : "已完成"}
					</Badge>
				</div>
				<div>
					<div className="mb-1 text-xs text-muted-foreground">耗时</div>
					<span className="text-sm font-medium">
						{formatDuration(record.duration)}
					</span>
				</div>
			</div>

			<div className="space-y-2">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<Clock3 className="size-4" />
					时间线
				</h3>
				<div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
					<div>
						<span className="text-muted-foreground">开始：</span>
						{format(new Date(record.startedAt), "yyyy-MM-dd HH:mm:ss")}
					</div>
					<div>
						<span className="text-muted-foreground">结束：</span>
						{format(new Date(record.finishedAt), "yyyy-MM-dd HH:mm:ss")}
					</div>
				</div>
			</div>

			{record.url && (
				<a
					href={record.url}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
				>
					<ExternalLink className="size-4" />
					打开原始内容
				</a>
			)}

			{record.failedReason && (
				<div className="space-y-2">
					<h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
						<AlertCircle className="size-4" />
						失败原因
					</h3>
					<p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
						{record.failedReason}
					</p>
				</div>
			)}

			{record.stacktrace && (
				<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
					{record.stacktrace}
				</pre>
			)}

			{record.returnValue !== null && (
				<div className="space-y-2">
					<h3 className="flex items-center gap-2 text-sm font-semibold">
						<CheckCircle2 className="size-4" />
						处理结果
					</h3>
					<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
						{JSON.stringify(record.returnValue, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

export function JobHistoryDetailDialog({
	record,
	open,
	onOpenChange,
}: JobHistoryDetailDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>执行历史详情</DialogTitle>
					<DialogDescription>
						查看持久化保存的任务结果、耗时与错误信息
					</DialogDescription>
				</DialogHeader>

				{record && <JobHistoryDetailContent record={record} />}
			</DialogContent>
		</Dialog>
	);
}

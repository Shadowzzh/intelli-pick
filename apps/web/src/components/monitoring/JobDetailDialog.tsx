// import { Badge } from "@/components/ui/badge";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogHeader,
// 	DialogTitle,
// } from "@/components/ui/dialog";
// import { useQueueJob } from "@/hooks/useQueueJobs";
// import { format } from "date-fns";
// import { AlertCircle, CheckCircle, Clock } from "lucide-react";

// interface JobDetailDialogProps {
// 	jobId: string | null;
// 	open: boolean;
// 	onOpenChange: (open: boolean) => void;
// }

// export function JobDetailDialog({
// 	jobId,
// 	open,
// 	onOpenChange,
// }: JobDetailDialogProps) {
// 	const { data: job, isLoading } = useQueueJob(jobId);

// 	return (
// 		<Dialog open={open} onOpenChange={onOpenChange}>
// 			<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
// 				<DialogHeader>
// 					<DialogTitle>任务详情</DialogTitle>
// 					<DialogDescription>查看任务的完整信息</DialogDescription>
// 				</DialogHeader>

// 				{isLoading && (
// 					<div className="text-center py-8 text-muted-foreground">
// 						加载中...
// 					</div>
// 				)}

// 				{job && (
// 					<div className="space-y-4">
// 						{/* 基本信息 */}
// 						<div className="grid grid-cols-2 gap-4">
// 							<div>
// 								<div className="text-sm text-muted-foreground mb-1">
// 									任务 ID
// 								</div>
// 								<Badge variant="outline">{job.id || "N/A"}</Badge>
// 							</div>
// 							<div>
// 								<div className="text-sm text-muted-foreground mb-1">
// 									重试次数
// 								</div>
// 								<Badge variant="secondary">{job.attemptsMade}</Badge>
// 							</div>
// 						</div>

// 						{/* 时间信息 */}
// 						<div className="space-y-2">
// 							<h3 className="font-semibold flex items-center gap-2">
// 								<Clock className="h-4 w-4" />
// 								时间线
// 							</h3>
// 							<div className="space-y-2 pl-6">
// 								{job.timestamp && (
// 									<div className="text-sm">
// 										<span className="text-muted-foreground">创建时间: </span>
// 										<span>
// 											{format(new Date(job.timestamp), "yyyy-MM-dd HH:mm:ss")}
// 										</span>
// 									</div>
// 								)}
// 								{job.processedOn && (
// 									<div className="text-sm">
// 										<span className="text-muted-foreground">开始处理: </span>
// 										<span>
// 											{format(new Date(job.processedOn), "yyyy-MM-dd HH:mm:ss")}
// 										</span>
// 									</div>
// 								)}
// 								{job.finishedOn && (
// 									<div className="text-sm">
// 										<span className="text-muted-foreground">完成时间: </span>
// 										<span>
// 											{format(new Date(job.finishedOn), "yyyy-MM-dd HH:mm:ss")}
// 										</span>
// 									</div>
// 								)}
// 							</div>
// 						</div>

// 						{job.stacktrace &&
// 							Array.isArray(job.stacktrace) &&
// 							job.stacktrace.length > 0 && (
// 								<div className="space-y-2">
// 									<h3 className="font-semibold flex items-center gap-2">
// 										<AlertCircle className="h-4 w-4" />
// 										堆栈跟踪
// 									</h3>
// 									<pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
// 										{job.stacktrace.join("\n")}
// 									</pre>
// 								</div>
// 							)}

// 						{/* 任务数据 */}
// 						<div className="space-y-2">
// 							<h3 className="font-semibold">任务数据</h3>
// 							<pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
// 								{JSON.stringify(job.data, null, 2)}
// 							</pre>
// 						</div>

// 						{/* 返回值 */}
// 						{job.returnvalue && (
// 							<div className="space-y-2">
// 								<h3 className="font-semibold flex items-center gap-2 text-green-500">
// 									<CheckCircle className="h-4 w-4" />
// 									返回值
// 								</h3>
// 								<pre className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-xs overflow-x-auto">
// 									{JSON.stringify(job.returnvalue, null, 2)}
// 								</pre>
// 							</div>
// 						)}
// 					</div>
// 				)}
// 			</DialogContent>
// 		</Dialog>
// 	);
// }

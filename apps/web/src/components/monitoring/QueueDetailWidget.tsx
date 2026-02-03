import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { useQueueJobs } from "@/hooks/useQueueJobs";
import type { JobStatus, QueueStatsResponseData } from "@intellipick/shared";
import { Layers } from "lucide-react";
import { useState } from "react";
import { JobCard } from "./JobCard";
import { JobDetailDialog } from "./JobDetailDialog";

interface QueueDetailWidgetProps {
	data?: QueueStatsResponseData;
}

export function QueueDetailWidget({ data }: QueueDetailWidgetProps) {
	const [activeTab, setActiveTab] = useState<JobStatus>("waiting");
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const { data: jobs, isLoading } = useQueueJobs(activeTab, 0, 4);

	if (!data || !data.queues || data.queues.length === 0) {
		return (
			<Widget title="队列详情" icon={<Layers className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无队列数据" iconType="default" />
			</Widget>
		);
	}

	const queue = data.queues[0];
	const total =
		queue.waiting +
		queue.active +
		queue.completed +
		queue.failed +
		queue.delayed;
	const progressPercent = total > 0 ? (queue.completed / total) * 100 : 0;

	const tabs: Array<{ value: JobStatus; label: string; count: number }> = [
		{ value: "waiting", label: "等待中", count: queue.waiting },
		{ value: "active", label: "处理中", count: queue.active },
		{ value: "completed", label: "已完成", count: queue.completed },
		{ value: "failed", label: "失败", count: queue.failed },
		{ value: "delayed", label: "延迟", count: queue.delayed },
	];

	return (
		<>
			<Widget
				title="队列详情"
				icon={<Layers className="h-4 w-4" />}
				actions={<Badge variant="outline">{queue.name}</Badge>}
				contentClassName="space-y-4"
			>
				{/* 队列状态网格 - 3x2 布局 */}
				<div className="grid grid-cols-3 gap-3">
					<div className="p-3 rounded-lg border bg-blue-500/5">
						<div className="text-xs text-muted-foreground mb-1">等待中</div>
						<div className="text-2xl font-bold text-blue-500">
							{queue.waiting}
						</div>
					</div>
					<div className="p-3 rounded-lg border bg-orange-500/5">
						<div className="text-xs text-muted-foreground mb-1">处理中</div>
						<div className="text-2xl font-bold text-orange-500">
							{queue.active}
						</div>
					</div>
					<div className="p-3 rounded-lg border bg-green-500/5">
						<div className="text-xs text-muted-foreground mb-1">已完成</div>
						<div className="text-2xl font-bold text-green-500">
							{queue.completed}
						</div>
					</div>
					<div className="p-3 rounded-lg border bg-red-500/5">
						<div className="text-xs text-muted-foreground mb-1">失败</div>
						<div className="text-2xl font-bold text-red-500">
							{queue.failed}
						</div>
					</div>
					<div className="p-3 rounded-lg border bg-purple-500/5">
						<div className="text-xs text-muted-foreground mb-1">延迟</div>
						<div className="text-2xl font-bold text-purple-500">
							{queue.delayed}
						</div>
					</div>
					<div className="p-3 rounded-lg border bg-muted/30">
						<div className="text-xs text-muted-foreground mb-1">总计</div>
						<div className="text-2xl font-bold">{total}</div>
					</div>
				</div>

				{/* 处理进度条 */}
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">处理进度</span>
						<span className="font-medium">{progressPercent.toFixed(1)}%</span>
					</div>
					<Progress value={progressPercent} className="h-3" />
				</div>

				{/* Worker 状态 */}
				{data.workers && (
					<div className="pt-3 border-t">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								活跃 Workers
							</span>
							<span className="font-semibold">
								{data.workers.active} / {data.workers.total}
							</span>
						</div>
					</div>
				)}

				{/* 任务列表标签页 */}
				<div className="pt-3 border-t">
					<Tabs
						defaultValue="waiting"
						value={activeTab}
						onValueChange={(v) => setActiveTab(v as JobStatus)}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-5 h-auto">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									className="text-xs py-1.5"
								>
									<span className="truncate">
										{tab.label}
										<span className="ml-1 font-semibold">({tab.count})</span>
									</span>
								</TabsTrigger>
							))}
						</TabsList>

						{tabs.map((tab) => (
							<TabsContent
								key={tab.value}
								value={tab.value}
								className="mt-3 space-y-2"
							>
								{isLoading ? (
									<div className="text-center py-4 text-sm text-muted-foreground">
										加载中...
									</div>
								) : !jobs || jobs.length === 0 ? (
									<div className="text-center py-4 text-sm text-muted-foreground">
										暂无任务
									</div>
								) : (
									<>
										{jobs.map((job) => (
											<JobCard
												key={job.id}
												job={job}
												onClick={() => setSelectedJobId(job.id || null)}
											/>
										))}
										{jobs.length >= 5 && (
											<div className="text-center text-xs text-muted-foreground pt-2">
												仅显示前 5 个任务
											</div>
										)}
									</>
								)}
							</TabsContent>
						))}
					</Tabs>
				</div>
			</Widget>

			<JobDetailDialog
				jobId={selectedJobId}
				open={!!selectedJobId}
				onOpenChange={(open) => !open && setSelectedJobId(null)}
			/>
		</>
	);
}

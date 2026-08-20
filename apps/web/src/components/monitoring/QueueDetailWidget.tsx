import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { useQueueJobs } from "@/hooks/useQueueJobs";
import type {
	JobStatus,
	QueueJob,
	QueueStatsResponseData,
} from "@intellipick/shared";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { JobsTable } from "./JobsTable";
import { StatusFilterBar } from "./StatusFilterBar";

interface QueueDetailWidgetProps {
	data?: QueueStatsResponseData;
}

export function QueueDetailWidget({ data }: QueueDetailWidgetProps) {
	const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
	const [page, setPage] = useState(0);
	const [allJobs, setAllJobs] = useState<QueueJob[]>([]);
	const [_, setSelectedJobId] = useState<string | null>(null);
	const pageSize = 20;

	// 获取任务列表
	const {
		data: jobs,
		isLoading,
		isFetching,
	} = useQueueJobs(
		statusFilter === "all"
			? ("waiting" as JobStatus)
			: (statusFilter as JobStatus),
		page * pageSize,
		(page + 1) * pageSize - 1,
	);

	// 累加数据
	useEffect(() => {
		if (jobs && !isFetching) {
			if (page === 0) {
				setAllJobs(jobs);
			} else {
				setAllJobs((prev) => {
					const newJobs = jobs.filter((j) => !prev.some((p) => p.id === j.id));
					return [...prev, ...newJobs];
				});
			}
		}
	}, [jobs, isFetching, page]);

	if (!data || !data.queues || data.queues.length === 0) {
		return (
			<Widget title="队列详情" icon={<Layers className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无队列数据" iconType="default" />
			</Widget>
		);
	}

	const queue = data.queues[0];

	// 筛选切换处理
	const handleStatusChange = (newStatus: JobStatus | "all") => {
		setStatusFilter(newStatus);
		setPage(0);
		setAllJobs([]);
	};

	// 加载更多
	const handleLoadMore = () => {
		if (!isFetching) {
			setPage((prev) => prev + 1);
		}
	};

	// 任务点击
	const handleJobClick = (job: QueueJob) => {
		setSelectedJobId(job.id || null);
	};

	return (
		<>
			<Widget
				title="队列详情"
				icon={<Layers className="h-4 w-4" />}
				actions={
					<div className="flex items-center gap-4">
						<StatusFilterBar
							value={statusFilter}
							onChange={handleStatusChange}
						/>
						<Badge variant="outline">{queue.name}</Badge>
					</div>
				}
			>
				<JobsTable
					jobs={allJobs}
					isLoading={isLoading && page === 0}
					isLoadingMore={isFetching && page > 0}
					hasMore={jobs?.length === pageSize}
					onJobClick={handleJobClick}
					onLoadMore={handleLoadMore}
				/>
			</Widget>

			{/* <JobDetailDialog
				jobId={selectedJobId}
				open={!!selectedJobId}
				onOpenChange={(open) => !open && setSelectedJobId(null)}
			/> */}
		</>
	);
}

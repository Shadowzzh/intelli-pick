import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { useQueueJobs } from "@/hooks/useQueueJobs";
import type {
	QueueJob,
	QueueJobFilter,
	QueueStatsResponseData,
} from "@intellipick/shared";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { JobDetailDialog } from "./JobDetailDialog";
import { JobsTable } from "./JobsTable";
import { StatusFilterBar } from "./StatusFilterBar";

interface QueueDetailWidgetProps {
	data?: QueueStatsResponseData;
}

export function QueueDetailWidget({ data }: QueueDetailWidgetProps) {
	const [statusFilter, setStatusFilter] = useState<QueueJobFilter>("all");
	const [page, setPage] = useState(0);
	const [allJobs, setAllJobs] = useState<QueueJob[]>([]);
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const pageSize = 20;

	// 获取任务列表
	const {
		data: jobs,
		isLoading,
		isFetching,
	} = useQueueJobs(statusFilter, page * pageSize, (page + 1) * pageSize - 1);

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
	const handleStatusChange = (newStatus: QueueJobFilter) => {
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
				headerClassName="flex-wrap items-start"
				actions={
					<div className="flex flex-wrap items-center justify-end gap-2">
						<StatusFilterBar
							value={statusFilter}
							onChange={handleStatusChange}
						/>
						<Badge variant="outline" className="max-w-40 truncate">
							{queue.name}
						</Badge>
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

			<JobDetailDialog
				jobId={selectedJobId}
				open={!!selectedJobId}
				onOpenChange={(open) => !open && setSelectedJobId(null)}
			/>
		</>
	);
}

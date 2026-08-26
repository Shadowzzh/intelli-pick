// apps/web/src/hooks/useQueueJobs.ts
import { getProcessingRate, getQueueJob, getQueueJobs } from "@/lib/api/queue";
import type {
	ProcessingRateStats,
	QueueJob,
	QueueJobDetail,
	QueueJobFilter,
} from "@intellipick/shared";
import { useQuery } from "@tanstack/react-query";

/**
 * 获取队列任务列表
 */
export function useQueueJobs(status: QueueJobFilter, start = 0, end = 9) {
	return useQuery<QueueJob[]>({
		queryKey: ["queue-jobs", status, start, end],
		queryFn: () => getQueueJobs(status, start, end),
		refetchInterval: 5000, // 每 5 秒刷新
	});
}

/**
 * 获取单个任务详情
 */
export function useQueueJob(jobId: string | null) {
	return useQuery<QueueJobDetail>({
		queryKey: ["queue-job", jobId],
		queryFn: () => {
			if (!jobId) throw new Error("jobId is required");
			return getQueueJob(jobId);
		},
		enabled: !!jobId,
	});
}

/**
 * 获取处理速率统计
 */
export function useProcessingRate() {
	return useQuery<ProcessingRateStats>({
		queryKey: ["processing-rate"],
		queryFn: getProcessingRate,
		refetchInterval: 10000, // 每 10 秒刷新
	});
}

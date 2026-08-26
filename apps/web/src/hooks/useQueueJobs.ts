// apps/web/src/hooks/useQueueJobs.ts
import {
	type ResolvedJobDetail,
	getProcessingRate,
	getQueueJobs,
	getResolvedJobDetail,
} from "@/lib/api/queue";
import type {
	ProcessingRateStats,
	QueueJob,
	QueueJobFilter,
} from "@intellipick/shared";
import { ApiRequestError, ErrorCode } from "@intellipick/shared";
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
export function useJobDetail(jobId: string | null) {
	return useQuery<ResolvedJobDetail>({
		queryKey: ["job-detail", jobId],
		queryFn: () => {
			if (!jobId) throw new Error("jobId is required");
			return getResolvedJobDetail(jobId);
		},
		enabled: !!jobId,
		retry: (failureCount, error) => {
			if (
				error instanceof ApiRequestError &&
				error.code === ErrorCode.NOT_FOUND
			) {
				return false;
			}
			return failureCount < 1;
		},
		refetchInterval: (query) => {
			const detail = query.state.data;
			if (
				detail?.origin === "queue" &&
				!detail.job.finishedOn &&
				!detail.job.failedReason
			) {
				return 2000;
			}
			return false;
		},
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

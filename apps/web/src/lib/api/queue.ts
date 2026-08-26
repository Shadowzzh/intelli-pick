// apps/web/src/lib/api/queue.ts
import type {
	ProcessingRateStats,
	QueueJob,
	QueueJobDetail,
	QueueJobFilter,
} from "@intellipick/shared";
import { api } from "../api";

/**
 * 获取队列任务列表
 */
export async function getQueueJobs(
	status: QueueJobFilter,
	start = 0,
	end = 9,
): Promise<QueueJob[]> {
	return api.get<QueueJob[]>(
		`/api/v1/queue/jobs?status=${status}&start=${start}&end=${end}`,
	);
}

/**
 * 获取单个任务详情
 */
export async function getQueueJob(jobId: string): Promise<QueueJobDetail> {
	return api.get<QueueJobDetail>(`/api/v1/queue/jobs/${jobId}`);
}

/**
 * 获取处理速率统计
 */
export async function getProcessingRate(): Promise<ProcessingRateStats> {
	return api.get<ProcessingRateStats>("/api/v1/queue/processing-rate");
}

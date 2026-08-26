// apps/web/src/lib/api/queue.ts
import type {
	JobHistoryRecord,
	ProcessingRateStats,
	QueueJob,
	QueueJobDetail,
	QueueJobFilter,
} from "@intellipick/shared";
import { ApiRequestError, ErrorCode } from "@intellipick/shared";
import { api } from "../api";
import { getJobHistoryByJobId } from "./job-history";

export type ResolvedJobDetail =
	| { origin: "queue"; job: QueueJobDetail }
	| { origin: "history"; record: JobHistoryRecord };

function isNotFoundError(error: unknown): boolean {
	return error instanceof ApiRequestError && error.code === ErrorCode.NOT_FOUND;
}

function wait(delayMs: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, delayMs));
}

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
	return api.get<QueueJobDetail>(
		`/api/v1/queue/jobs/${encodeURIComponent(jobId)}`,
	);
}

export async function getResolvedJobDetail(
	jobId: string,
): Promise<ResolvedJobDetail> {
	try {
		const job = await getQueueJob(jobId);
		return { origin: "queue", job };
	} catch (error) {
		if (!isNotFoundError(error)) {
			throw error;
		}
	}

	let lastError: unknown;
	for (const delayMs of [0, 150, 350]) {
		if (delayMs > 0) {
			await wait(delayMs);
		}
		try {
			const record = await getJobHistoryByJobId(jobId);
			return { origin: "history", record };
		} catch (error) {
			if (!isNotFoundError(error)) {
				throw error;
			}
			lastError = error;
		}
	}

	throw lastError;
}

/**
 * 获取处理速率统计
 */
export async function getProcessingRate(): Promise<ProcessingRateStats> {
	return api.get<ProcessingRateStats>("/api/v1/queue/processing-rate");
}

import type {
	QueueJobFilter,
	QueueMetrics,
	QueueStatsResponseData,
	SystemResourceMetrics,
	WorkerStats,
} from "@intellipick/shared";
// apps/api/src/services/queue.service.ts
import { Queue } from "bullmq";

export class QueueService {
	private queue: Queue<unknown> | null = null;
	private queueName: string;

	constructor(redisUrl?: string, queueName = "intellipick-pipeline") {
		this.queueName = queueName;
		if (redisUrl) {
			this.queue = new Queue<unknown>(queueName, {
				connection: { url: redisUrl },
			});
		}
	}

	/**
	 * 获取队列状态统计
	 */
	async getStats() {
		if (!this.queue) {
			return {
				success: true,
				data: {
					queues: [],
					workers: { active: 0, total: 0 },
				} as QueueStatsResponseData,
			};
		}

		const [queueMetrics, workerStats] = await Promise.all([
			this.getQueueMetrics(),
			this.getWorkerStats(),
		]);

		return {
			success: true,
			data: {
				queues: queueMetrics,
				workers: workerStats,
			} as QueueStatsResponseData,
		};
	}

	async getRedisHealth(): Promise<SystemResourceMetrics["redis"]> {
		if (!this.queue) {
			return { status: "disconnected" };
		}

		try {
			const client = await this.queue.client;
			const [ping, memoryInfo] = await Promise.all([
				client.ping(),
				client.info("memory"),
			]);
			if (ping !== "PONG") {
				return { status: "disconnected" };
			}

			const memory = parseRedisMemoryInfo(memoryInfo);
			return {
				status: "connected",
				...memory,
			};
		} catch {
			return { status: "disconnected" };
		}
	}

	/**
	 * 获取队列指标
	 */
	private async getQueueMetrics(): Promise<QueueMetrics[]> {
		if (!this.queue) {
			return [];
		}

		const counts = await this.queue.getJobCounts(
			"waiting",
			"active",
			"completed",
			"failed",
			"delayed",
		);

		return [
			{
				name: this.queueName,
				waiting: counts.waiting,
				active: counts.active,
				completed: counts.completed,
				failed: counts.failed,
				delayed: counts.delayed,
			},
		];
	}

	/**
	 * 获取 BullMQ 当前注册的 Worker 和正在处理的任务数量
	 */
	private async getWorkerStats(): Promise<WorkerStats> {
		if (!this.queue) {
			return { active: 0, total: 0 };
		}

		const [workers, counts] = await Promise.all([
			this.queue.getWorkers(),
			this.queue.getJobCounts("active"),
		]);

		return deriveWorkerStats(workers.length, counts.active);
	}

	/**
	 * 获取任务列表
	 */
	async getJobs(status: QueueJobFilter, start = 0, end = 9) {
		if (!this.queue) {
			return { success: true, data: [] };
		}

		// BullMQ 的 getJobs 方法：start 和 end 是索引范围（包含 start 和 end）
		// 例如：start=0, end=9 返回 10 个任务（索引 0-9）
		const statuses =
			status === "all"
				? (["waiting", "active", "completed", "failed", "delayed"] as const)
				: [status];
		const jobs = await this.queue.getJobs([...statuses], start, end, true);

		return {
			success: true,
			data: jobs.map((job) => ({
				id: job.id,
				name: job.name,
				data: job.data,
				progress: job.progress,
				attemptsMade: job.attemptsMade,
				timestamp: job.timestamp,
				processedOn: job.processedOn,
				finishedOn: job.finishedOn,
				failedReason: job.failedReason,
				stacktrace: job.stacktrace,
				returnvalue: job.returnvalue,
			})),
		};
	}

	/**
	 * 获取单个任务详情
	 */
	async getJob(jobId: string) {
		if (!this.queue) {
			return { success: false, error: "Queue not initialized" };
		}

		const job = await this.queue.getJob(jobId);
		if (!job) {
			return { success: false, error: "Job not found" };
		}

		return {
			success: true,
			data: {
				id: job.id,
				name: job.name,
				data: job.data,
				progress: job.progress,
				attemptsMade: job.attemptsMade,
				timestamp: job.timestamp,
				processedOn: job.processedOn,
				finishedOn: job.finishedOn,
				failedReason: job.failedReason,
				stacktrace: job.stacktrace,
				returnvalue: job.returnvalue,
				opts: job.opts,
			},
		};
	}

	/**
	 * 获取处理速率统计
	 */
	async getProcessingRate() {
		if (!this.queue) {
			return {
				success: true,
				data: {
					completedPerMinute: 0,
					failedPerMinute: 0,
					avgProcessingTime: 0,
				},
			};
		}

		// 获取最近完成的任务来计算速率
		const completedJobs = await this.queue.getJobs(["completed"], 0, 99);
		const failedJobs = await this.queue.getJobs(["failed"], 0, 99);

		const now = Date.now();
		const oneMinuteAgo = now - 60 * 1000;

		// 计算最近一分钟的完成和失败数
		const recentCompleted = completedJobs.filter(
			(job) => job.finishedOn && job.finishedOn > oneMinuteAgo,
		);
		const recentFailed = failedJobs.filter(
			(job) => job.finishedOn && job.finishedOn > oneMinuteAgo,
		);

		// 计算平均处理时间
		let totalProcessingTime = 0;
		let processedCount = 0;

		for (const job of recentCompleted) {
			if (job.processedOn && job.finishedOn) {
				totalProcessingTime += job.finishedOn - job.processedOn;
				processedCount++;
			}
		}

		const avgProcessingTime =
			processedCount > 0 ? totalProcessingTime / processedCount : 0;

		return {
			success: true,
			data: {
				completedPerMinute: recentCompleted.length,
				failedPerMinute: recentFailed.length,
				avgProcessingTime: Math.round(avgProcessingTime),
			},
		};
	}

	/**
	 * 关闭队列连接
	 */
	async close() {
		if (this.queue) {
			await this.queue.close();
			this.queue = null;
		}
	}
}

export function deriveWorkerStats(
	totalWorkers: number,
	activeJobs: number,
): WorkerStats {
	return {
		total: totalWorkers,
		active: Math.min(totalWorkers, activeJobs),
	};
}

export function parseRedisMemoryInfo(info: string): {
	memoryUsage?: number;
	memoryLimit?: number;
} {
	let memoryUsage: number | undefined;
	let memoryLimit: number | undefined;

	for (const line of info.split("\n")) {
		const [key, rawValue] = line.trim().split(":", 2);
		if (!rawValue) {
			continue;
		}

		const value = Number.parseInt(rawValue, 10);
		if (!Number.isFinite(value)) {
			continue;
		}
		if (key === "used_memory") {
			memoryUsage = value;
		} else if (key === "maxmemory") {
			memoryLimit = value;
		}
	}

	return { memoryUsage, memoryLimit };
}

import type {
	QueueMetrics,
	QueueStatsResponseData,
	WorkerStats,
} from "@intellipick/shared";
// apps/api/src/services/queue.service.ts
import { Queue } from "bullmq";

export class QueueService {
	private queue: Queue<unknown> | null = null;
	private queueName: string;

	constructor(redisUrl?: string, queueName = "ai-filter-pipeline") {
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

		// 获取队列指标
		const queueMetrics = await this.getQueueMetrics();

		// 获取 worker 统计（估算值，因为 API 无法直接访问 Worker 实例）
		const workerStats = await this.getWorkerStats();

		return {
			success: true,
			data: {
				queues: queueMetrics,
				workers: workerStats,
			} as QueueStatsResponseData,
		};
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
	 * 获取 worker 统计
	 * 注意：由于 BullMQ 的 worker 是独立进程，这里使用 Redis 来估算
	 */
	private async getWorkerStats(): Promise<WorkerStats> {
		if (!this.queue) {
			return { active: 0, total: 0 };
		}

		// 使用 active 任务数量作为估算
		// 注意：这不是精确的 worker 数量，而是一个近似值
		const counts = await this.queue.getJobCounts("active");

		return {
			active: counts.active, // 使用 active 任务数作为近似
			total: counts.active, // 同样使用 active 任务数
		};
	}

	/**
	 * 获取任务列表
	 */
	async getJobs(
		status: "waiting" | "active" | "completed" | "failed" | "delayed",
		start = 0,
		end = 9,
	) {
		if (!this.queue) {
			return { success: true, data: [] };
		}

		// BullMQ 的 getJobs 方法：start 和 end 是索引范围（包含 start 和 end）
		// 例如：start=0, end=9 返回 10 个任务（索引 0-9）
		const jobs = await this.queue.getJobs([status], start, end, true);

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

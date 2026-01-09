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
	 * 关闭队列连接
	 */
	async close() {
		if (this.queue) {
			await this.queue.close();
			this.queue = null;
		}
	}
}

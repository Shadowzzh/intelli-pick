// apps/api/src/services/monitoring.service.ts
import type {
	AiPerformanceMetrics,
	MonitoringData,
	SystemOverview,
	SystemResourceMetrics,
} from "@intellipick/shared";
import type { ContentsService } from "./contents.service";
import type { EntitiesService } from "./entities.service";
import type { QueueService } from "./queue.service";
import type { SourcesService } from "./sources.service";
import type { StatsService } from "./stats.service";

export class MonitoringService {
	constructor(
		private statsService: StatsService,
		private queueService: QueueService | null,
		private sourcesService: SourcesService,
		private contentsService: ContentsService,
		private entitiesService: EntitiesService,
	) {}

	/**
	 * 获取完整的监控数据
	 */
	async getMonitoringData(): Promise<MonitoringData> {
		// 并行获取所有监控数据
		const [
			overview,
			queueStats,
			sourcesHealth,
			aiPerformance,
			systemResources,
		] = await Promise.all([
			this.getSystemOverview(),
			this.getQueueStats(),
			this.getSourcesHealth(),
			this.getAiPerformance(),
			this.getSystemResources(),
		]);

		return {
			overview,
			queue: queueStats,
			sources: sourcesHealth,
			aiPerformance,
			systemResources,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * 获取系统概览统计
	 */
	private async getSystemOverview(): Promise<SystemOverview> {
		const stats = await this.statsService.getStats();
		const queueStats = this.queueService
			? await this.queueService.getStats()
			: null;

		const queueData = queueStats?.data;
		const queueWaiting = queueData?.queues[0]?.waiting || 0;
		const queueActive = queueData?.queues[0]?.active || 0;
		const queueFailed = queueData?.queues[0]?.failed || 0;

		// 判断系统状态
		let systemStatus: "healthy" | "warning" | "error" = "healthy";
		if (queueFailed > 10 || queueWaiting > 100) {
			systemStatus = "warning";
		}
		if (queueFailed > 50 || queueWaiting > 500) {
			systemStatus = "error";
		}

		return {
			totalContents: stats.totalContents,
			totalEntities: stats.totalEntities,
			activeSources: stats.activeSources,
			todayNew: stats.todayNew,
			queueWaiting,
			queueActive,
			systemStatus,
		};
	}

	/**
	 * 获取队列统计数据
	 */
	private async getQueueStats() {
		if (!this.queueService) {
			return {
				queues: [],
				workers: { active: 0, total: 0 },
			};
		}

		const result = await this.queueService.getStats();
		return result.data;
	}

	/**
	 * 获取数据源健康状态
	 */
	private async getSourcesHealth() {
		const result = await this.sourcesService.getHealthStatus();
		return result.data;
	}

	/**
	 * 获取 AI 处理性能指标
	 * 注意：这里返回模拟数据，实际应该从日志或统计表中获取
	 */
	private async getAiPerformance(): Promise<AiPerformanceMetrics> {
		// TODO: 实现真实的 AI 性能统计
		// 可以考虑：
		// 1. 在 Pipeline 中记录每次 AI 调用的结果和耗时
		// 2. 存储到 Redis 或专门的统计表
		// 3. 这里从存储中读取并计算统计数据

		return {
			filterCalls: 0,
			filterSuccessRate: 0,
			extractCalls: 0,
			extractSuccessRate: 0,
			avgResponseTime: 0,
			passRate: 0,
		};
	}

	/**
	 * 获取系统资源使用情况
	 */
	private async getSystemResources(): Promise<SystemResourceMetrics> {
		// TODO: 实现真实的系统资源监控
		// 可以考虑：
		// 1. 数据库：通过 Drizzle 或原生查询获取连接池状态
		// 2. Redis：通过 INFO 命令获取内存使用情况
		// 3. API：记录请求统计（可以用中间件）

		return {
			database: {
				status: "connected",
			},
			redis: {
				status: this.queueService ? "connected" : "disconnected",
			},
			api: {
				requestCount: 0,
				avgResponseTime: 0,
				errorRate: 0,
			},
		};
	}
}

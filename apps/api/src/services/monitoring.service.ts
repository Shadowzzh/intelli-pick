// apps/api/src/services/monitoring.service.ts
import type { AiConfig, AiTaskName } from "@intellipick/config";
import type {
	AiPerformanceMetrics,
	AiTaskPerformanceMetrics,
	MonitoringData,
	QueueStatsResponseData,
	SourceHealthResponseData,
	SystemOverview,
	SystemResourceMetrics,
} from "@intellipick/shared";
import type { ApiMetricsCollector } from "../lib/api-metrics";
import type { ContentsService } from "./contents.service";
import type { EntitiesService } from "./entities.service";
import type { JobHistoryService } from "./job-history.service";
import type { QueueService } from "./queue.service";
import type { SourcesService } from "./sources.service";
import type { StatsService } from "./stats.service";

export interface SystemStatusInput {
	databaseConnected: boolean;
	redisConnected: boolean;
	queueWaiting: number;
	queueFailed: number;
	sourceTotal: number;
	sourceDisabled: number;
	sourceDelayed: number;
	sourceErrors: number;
	sourcePending: number;
	extractSuccessRate: number | null;
	apiRequestCount: number;
	apiErrorRate: number;
}

export function deriveSystemStatus(
	input: SystemStatusInput,
): SystemOverview["systemStatus"] {
	if (!input.databaseConnected || !input.redisConnected) {
		return "error";
	}

	const activeSources = input.sourceTotal - input.sourceDisabled;
	const allActiveSourcesFailed =
		activeSources > 0 && input.sourceErrors >= activeSources;
	const apiHasEnoughSamples = input.apiRequestCount >= 5;
	if (
		input.queueFailed > 50 ||
		input.queueWaiting > 500 ||
		allActiveSourcesFailed ||
		(apiHasEnoughSamples && input.apiErrorRate >= 0.2)
	) {
		return "error";
	}

	const aiNeedsAttention =
		input.extractSuccessRate !== null && input.extractSuccessRate < 0.95;

	if (
		input.queueFailed > 10 ||
		input.queueWaiting > 100 ||
		input.sourceErrors > 0 ||
		input.sourceDelayed > 0 ||
		input.sourcePending > 0 ||
		aiNeedsAttention ||
		(apiHasEnoughSamples && input.apiErrorRate >= 0.05)
	) {
		return "warning";
	}

	return "healthy";
}

export class MonitoringService {
	constructor(
		private statsService: StatsService,
		private queueService: QueueService | null,
		private sourcesService: SourcesService,
		private contentsService: ContentsService,
		private entitiesService: EntitiesService,
		private jobHistoryService: JobHistoryService,
		private apiMetrics: ApiMetricsCollector,
		private aiConfig?: AiConfig,
	) {}

	/**
	 * 获取完整的监控数据
	 */
	async getMonitoringData(): Promise<MonitoringData> {
		// 并行获取所有监控数据
		const [stats, queueStats, sourcesHealth, aiPerformance, systemResources] =
			await Promise.all([
				this.statsService.getStats(),
				this.getQueueStats(),
				this.getSourcesHealth(),
				this.getAiPerformance(),
				this.getSystemResources(),
			]);
		const overview = this.getSystemOverview({
			stats,
			queueStats,
			sourcesHealth,
			aiPerformance,
			systemResources,
		});

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
	private getSystemOverview(params: {
		stats: Awaited<ReturnType<StatsService["getStats"]>>;
		queueStats: QueueStatsResponseData;
		sourcesHealth: SourceHealthResponseData;
		aiPerformance: AiPerformanceMetrics;
		systemResources: SystemResourceMetrics;
	}): SystemOverview {
		const queue = params.queueStats.queues[0];
		const queueWaiting = queue?.waiting || 0;
		const queueActive = queue?.active || 0;
		const queueFailed = queue?.failed || 0;
		const sourceSummary = params.sourcesHealth.summary;
		const systemStatus = deriveSystemStatus({
			databaseConnected: params.systemResources.database.status === "connected",
			redisConnected: params.systemResources.redis.status === "connected",
			queueWaiting,
			queueFailed,
			sourceTotal: sourceSummary.total,
			sourceDisabled: sourceSummary.disabled,
			sourceDelayed: sourceSummary.delayed,
			sourceErrors: sourceSummary.error,
			sourcePending: sourceSummary.pending,
			extractSuccessRate: params.aiPerformance.extract.successRate,
			apiRequestCount: params.systemResources.api.requestCount,
			apiErrorRate: params.systemResources.api.errorRate,
		});

		return {
			totalContents: params.stats.totalContents,
			totalEntities: params.stats.totalEntities,
			activeSources: params.stats.activeSources,
			todayNew: params.stats.todayNew,
			queueWaiting,
			queueActive,
			systemStatus,
		};
	}

	/**
	 * 获取队列统计数据
	 */
	private async getQueueStats(): Promise<QueueStatsResponseData> {
		if (!this.queueService) {
			return {
				queues: [],
				workers: { active: 0, total: 0 },
			};
		}

		try {
			const result = await this.queueService.getStats();
			return result.data;
		} catch {
			return {
				queues: [],
				workers: { active: 0, total: 0 },
			};
		}
	}

	/**
	 * 获取数据源健康状态
	 */
	private async getSourcesHealth(): Promise<SourceHealthResponseData> {
		const result = await this.sourcesService.getHealthStatus();
		return result.data;
	}

	/**
	 * 获取 AI 处理性能指标
	 */
	private async getAiPerformance(): Promise<AiPerformanceMetrics> {
		const metrics = await this.jobHistoryService.getAiPerformance(24);
		this.addConfiguredTaskInfo(metrics.extract, "extractAndClassify");
		return metrics;
	}

	private addConfiguredTaskInfo(
		metrics: AiTaskPerformanceMetrics,
		taskName: AiTaskName,
	): void {
		const task = this.aiConfig?.tasks[taskName];
		if (!task) {
			return;
		}

		metrics.configuredModels = [
			task.model,
			...metrics.configuredModels.filter((model) => model !== task.model),
		];
		metrics.providers = [
			task.provider,
			...metrics.providers.filter((provider) => provider !== task.provider),
		];

		const providerConfig = this.aiConfig?.providers[task.provider];
		if (!providerConfig) {
			return;
		}

		let protocol: "responses" | "chat-completions" | "anthropic";
		if (providerConfig.type === "anthropic") {
			protocol = "anthropic";
		} else {
			protocol = providerConfig.protocol;
		}
		metrics.protocols = [
			protocol,
			...metrics.protocols.filter((item) => item !== protocol),
		];
	}

	/**
	 * 获取系统资源使用情况
	 */
	private async getSystemResources(): Promise<SystemResourceMetrics> {
		const [database, redis] = await Promise.all([
			this.statsService.getDatabaseHealth(),
			this.queueService
				? this.queueService.getRedisHealth()
				: Promise.resolve({ status: "disconnected" as const }),
		]);

		return {
			database,
			redis,
			api: this.apiMetrics.getSnapshot(),
		};
	}
}

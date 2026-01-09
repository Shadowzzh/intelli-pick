// apps/api/src/services/sources.service.ts
import type { Source } from "@intellipick/db";
import type { SourceHealthStatus, SourceStatus } from "@intellipick/shared";
import type { SourcesRepository } from "../repositories/sources.repository";

export class SourcesService {
	constructor(private sourcesRepo: SourcesRepository) {}

	async findById(id: string): Promise<Source | null> {
		return await this.sourcesRepo.findById(id);
	}

	async findAll(): Promise<Source[]> {
		return await this.sourcesRepo.findAll();
	}

	/**
	 * 计算数据源的健康状态
	 * - healthy: 最后采集时间 < 1.5 × fetchInterval
	 * - delayed: 最后采集时间 > 1.5 × fetchInterval 但 < 3 × fetchInterval
	 * - error: 最后采集时间 > 3 × fetchInterval
	 * - disabled: enabled = false
	 */
	private calculateHealthStatus(source: Source): SourceHealthStatus {
		if (!source.enabled) {
			return "disabled" as SourceHealthStatus;
		}

		if (!source.lastFetchedAt) {
			return "error" as SourceHealthStatus;
		}

		const now = new Date();
		const lastFetched = new Date(source.lastFetchedAt);
		const timeSinceLastFetch = now.getTime() - lastFetched.getTime();
		const fetchInterval = source.fetchInterval ?? 3600; // 默认 3600 秒
		const fetchIntervalMs = fetchInterval * 1000;

		if (timeSinceLastFetch > 3 * fetchIntervalMs) {
			return "error" as SourceHealthStatus;
		}

		if (timeSinceLastFetch > 1.5 * fetchIntervalMs) {
			return "delayed" as SourceHealthStatus;
		}

		return "healthy" as SourceHealthStatus;
	}

	/**
	 * 获取数据源状态信息（包含健康状态）
	 */
	private getSourceStatus(source: Source): SourceStatus {
		const healthStatus = this.calculateHealthStatus(source);

		// 计算下次采集时间
		let nextFetchAt: Date | null = null;
		if (source.lastFetchedAt && source.enabled) {
			const fetchInterval = source.fetchInterval ?? 3600; // 默认 3600 秒
			nextFetchAt = new Date(
				new Date(source.lastFetchedAt).getTime() + fetchInterval * 1000,
			);
		}

		return {
			id: source.id,
			name: source.name,
			type: source.type,
			enabled: source.enabled ?? true,
			fetchInterval: source.fetchInterval ?? 3600,
			lastFetchedAt: source.lastFetchedAt,
			lastFetchStatus: healthStatus === "error" ? "failed" : "success",
			healthStatus,
			nextFetchAt,
		};
	}

	/**
	 * 获取所有数据源的健康状态
	 */
	async getHealthStatus() {
		const sources = await this.sourcesRepo.findAll();
		const sourceStatuses = sources.map((s) => this.getSourceStatus(s));

		// 计算汇总统计
		const summary = {
			total: sourceStatuses.length,
			healthy: sourceStatuses.filter((s) => s.healthStatus === "healthy")
				.length,
			delayed: sourceStatuses.filter((s) => s.healthStatus === "delayed")
				.length,
			error: sourceStatuses.filter((s) => s.healthStatus === "error").length,
			disabled: sourceStatuses.filter((s) => s.healthStatus === "disabled")
				.length,
		};

		return {
			success: true,
			data: {
				sources: sourceStatuses,
				summary,
			},
		};
	}
}

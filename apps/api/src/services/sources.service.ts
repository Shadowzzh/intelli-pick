// apps/api/src/services/sources.service.ts
import type { Source } from "@intellipick/db";
import {
	type SourceFetchStatus,
	SourceHealthStatus,
	type SourceStatus,
} from "@intellipick/shared";
import { NotFoundError, ValidationError } from "../lib/errors";
import type { SourcesRepository } from "../repositories/sources.repository";

export class SourcesService {
	constructor(private sourcesRepo: SourcesRepository) {}

	async findById(id: string): Promise<Source | null> {
		return await this.sourcesRepo.findById(id);
	}

	async findAll(): Promise<Source[]> {
		return await this.sourcesRepo.findAll();
	}

	async setEnabled(id: string, enabled: boolean): Promise<SourceStatus> {
		const source = await this.sourcesRepo.findById(id);
		if (!source) {
			throw new NotFoundError("Source", id);
		}
		if (!source.isConfigured) {
			throw new ValidationError("已从配置移除的数据源不能重新启用");
		}

		const updated = await this.sourcesRepo.updateEnabled(id, enabled);
		if (!updated) {
			throw new NotFoundError("Source", id);
		}
		return this.getSourceStatus(updated);
	}

	/**
	 * 计算数据源的健康状态
	 * - healthy: 最后采集时间 < 1.5 × fetchInterval
	 * - delayed: 最后采集时间 > 1.5 × fetchInterval 但 < 3 × fetchInterval
	 * - error: 最近一次失败，或最后采集时间 > 3 × fetchInterval
	 * - pending: 启用但尚未完成过采集
	 * - disabled: enabled = false
	 */
	private calculateHealthStatus(source: Source): SourceHealthStatus {
		if (!source.enabled) {
			return SourceHealthStatus.DISABLED;
		}

		if (source.lastFetchStatus === "failed") {
			return SourceHealthStatus.ERROR;
		}

		if (!source.lastFetchedAt) {
			return SourceHealthStatus.PENDING;
		}

		const now = new Date();
		const lastFetched = new Date(source.lastFetchedAt);
		const timeSinceLastFetch = now.getTime() - lastFetched.getTime();
		const fetchInterval = source.fetchInterval ?? 3600; // 默认 3600 秒
		const fetchIntervalMs = fetchInterval * 1000;

		if (timeSinceLastFetch > 3 * fetchIntervalMs) {
			return SourceHealthStatus.ERROR;
		}

		if (timeSinceLastFetch > 1.5 * fetchIntervalMs) {
			return SourceHealthStatus.DELAYED;
		}

		return SourceHealthStatus.HEALTHY;
	}

	private normalizeFetchStatus(value: string): SourceFetchStatus {
		if (value === "running" || value === "success" || value === "failed") {
			return value;
		}
		return "never";
	}

	/**
	 * 获取数据源状态信息（包含健康状态）
	 */
	private getSourceStatus(source: Source): SourceStatus {
		const healthStatus = this.calculateHealthStatus(source);

		// 计算下次采集时间
		let nextFetchAt: Date | null = null;
		const lastScheduledAt = source.lastAttemptedAt || source.lastFetchedAt;
		if (lastScheduledAt && source.enabled) {
			const fetchInterval = source.fetchInterval ?? 3600; // 默认 3600 秒
			nextFetchAt = new Date(
				new Date(lastScheduledAt).getTime() + fetchInterval * 1000,
			);
		}

		// 从 config 中提取 URL
		const config = source.config as Record<string, unknown>;
		const url = typeof config?.url === "string" ? config.url : undefined;

		return {
			id: source.id,
			name: source.name,
			type: source.type,
			url,
			enabled: source.enabled ?? true,
			isConfigured: source.isConfigured,
			fetchInterval: source.fetchInterval ?? 3600,
			scheduleMinute: source.scheduleMinute ?? 0,
			lastAttemptedAt: source.lastAttemptedAt,
			lastFetchedAt: source.lastFetchedAt,
			lastCollectedAt: source.lastFetchedAt,
			lastFetchStatus: this.normalizeFetchStatus(source.lastFetchStatus),
			lastFetchError: source.lastFetchError,
			lastItemCount: source.lastItemCount,
			lastNewCount: source.lastNewCount,
			lastDurationMs: source.lastDurationMs,
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
			pending: sourceStatuses.filter((s) => s.healthStatus === "pending")
				.length,
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

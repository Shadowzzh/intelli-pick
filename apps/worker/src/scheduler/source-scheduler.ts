import type { SourceConfig } from "@intellipick/config";
import { db, sources } from "@intellipick/db";
import type { Queue } from "bullmq";
import { CronJob } from "cron";
import { eq } from "drizzle-orm";
import type { CollectorManager } from "../collector/index";
import { filterExistingContent } from "../lib/dedup";
import { createLogger } from "../lib/logger";
import { convertToCron } from "./cron-converter";

const logger = createLogger("source-scheduler");
const COLLECTION_TIMEOUT_MS = 35 * 1000;

export class SourceScheduler {
	private cronJobs: CronJob[] = [];
	private locks = new Map<string, { locked: boolean; lockedAt: Date }>();

	constructor(
		private sources: SourceConfig[],
		private sourceMap: Map<string, string>,
		private collector: CollectorManager,
		private queue: Queue,
		private timezone: string,
		private readonly lockTimeout: number,
	) {}

	/**
	 * 启动所有调度器
	 */
	start(): void {
		for (const source of this.sources) {
			this.scheduleSource(source);
		}

		logger.info(
			{
				totalSources: this.sources.length,
				timezone: this.timezone,
			},
			"Scheduler started",
		);
	}

	/**
	 * 为单个 source 创建调度
	 */
	private scheduleSource(source: SourceConfig): void {
		const cronExpr = convertToCron(source.fetchInterval, source.scheduleMinute);

		const job = new CronJob(
			cronExpr,
			() => this.collectOne(source),
			null,
			true,
			this.timezone,
		);

		this.cronJobs.push(job);

		logger.info(
			{ source: source.name, interval: source.fetchInterval, cron: cronExpr },
			"Scheduled source",
		);
	}

	/**
	 * 立即执行所有 source 的首次采集
	 */
	async initialCollection(): Promise<void> {
		await Promise.allSettled(
			this.sources.map((source) => this.collectOne(source)),
		);
	}

	/**
	 * 采集单个 source（带锁保护）
	 */
	private async collectOne(source: SourceConfig): Promise<void> {
		const startTime = Date.now();
		const sourceId = this.sourceMap.get(source.name);
		if (!sourceId) {
			logger.error({ source: source.name }, "Source ID not found");
			return;
		}

		let runtimeState:
			| { enabled: boolean | null; isConfigured: boolean }
			| undefined;
		try {
			[runtimeState] = await db
				.select({
					enabled: sources.enabled,
					isConfigured: sources.isConfigured,
				})
				.from(sources)
				.where(eq(sources.id, sourceId))
				.limit(1);
		} catch (err) {
			logger.error(
				{ source: source.name, err },
				"Failed to read source runtime state",
			);
			return;
		}

		if (!runtimeState?.isConfigured || !runtimeState.enabled) {
			logger.info({ source: source.name }, "Skipping disabled source");
			return;
		}

		// 检查锁
		if (!this.acquireLock(source.name)) {
			logger.info(
				{ source: source.name },
				"Skipping - collection still running",
			);
			return;
		}

		try {
			await db
				.update(sources)
				.set({
					lastAttemptedAt: new Date(startTime),
					lastFetchStatus: "running",
					lastFetchError: null,
					updatedAt: new Date(),
				})
				.where(eq(sources.id, sourceId));

			logger.info({ source: source.name }, "Starting collection...");

			// 外层超时略长于采集插件的 30 秒请求超时，避免误判成功响应。
			const items = await Promise.race([
				this.collector.collectSource(source),
				new Promise<never>((_, reject) =>
					setTimeout(
						() => reject(new Error("Collection timeout after 35s")),
						COLLECTION_TIMEOUT_MS,
					),
				),
			]);

			// 去重
			const newItems = await filterExistingContent(items);

			// 入队
			for (const item of newItems) {
				await this.queue.add("process", item, {
					jobId: `${item.sourceType}-${item.externalId.replace(/:/g, "-")}`,
					removeOnComplete: true,
					removeOnFail: 100,
				});
			}

			const duration = Date.now() - startTime;
			await db
				.update(sources)
				.set({
					lastFetchedAt: new Date(),
					lastFetchStatus: "success",
					lastFetchError: null,
					lastItemCount: items.length,
					lastNewCount: newItems.length,
					lastDurationMs: duration,
					updatedAt: new Date(),
				})
				.where(eq(sources.id, sourceId));

			logger.info(
				{
					source: source.name,
					count: items.length,
					new: newItems.length,
					duplicate: items.length - newItems.length,
					duration: `${duration}ms`,
				},
				"Collection completed",
			);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			const isTimeout = errorMessage.includes("timeout");
			const duration = Date.now() - startTime;

			try {
				await db
					.update(sources)
					.set({
						lastFetchStatus: "failed",
						lastFetchError: errorMessage,
						lastItemCount: null,
						lastNewCount: null,
						lastDurationMs: duration,
						updatedAt: new Date(),
					})
					.where(eq(sources.id, sourceId));
			} catch (statusError) {
				logger.error(
					{ source: source.name, err: statusError },
					"Failed to update source health",
				);
			}

			logger.error(
				{
					source: source.name,
					error: errorMessage,
					errorType: isTimeout ? "TIMEOUT_ERROR" : "COLLECTION_ERROR",
				},
				isTimeout ? "Collection timeout" : "Collection failed",
			);
		} finally {
			this.releaseLock(source.name);
		}
	}

	/**
	 * 尝试获取锁
	 */
	private acquireLock(sourceName: string): boolean {
		const lock = this.locks.get(sourceName);

		if (
			!lock?.locked ||
			Date.now() - lock.lockedAt.getTime() > this.lockTimeout
		) {
			if (lock?.locked) {
				logger.warn(
					{ source: sourceName, lockedAt: lock.lockedAt },
					"Lock timeout detected, auto-releasing",
				);
			}
			this.locks.set(sourceName, {
				locked: true,
				lockedAt: new Date(),
			});
			return true;
		}

		return false;
	}

	/**
	 * 释放锁
	 */
	private releaseLock(sourceName: string): void {
		this.locks.set(sourceName, {
			locked: false,
			lockedAt: new Date(),
		});
	}

	/**
	 * 停止所有调度器
	 */
	stop(): void {
		for (const job of this.cronJobs) {
			job.stop();
		}
		logger.info("Scheduler stopped");
	}
}

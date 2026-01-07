import type { SourceConfig } from "@intellipick/config";
import type { CollectorManager } from "../collector/index";
import type { Queue } from "bullmq";
import type { RawContent } from "@intellipick/shared";
import { CronJob } from "cron";
import { filterExistingContent } from "../lib/dedup";
import { createLogger } from "../lib/logger";
import { convertToCron } from "./cron-converter";

const logger = createLogger("source-scheduler");

export class SourceScheduler {
	private cronJobs: CronJob[] = [];
	private locks = new Map<string, { locked: boolean; lockedAt: Date }>();

	constructor(
		private sources: SourceConfig[],
		private collector: CollectorManager,
		private queue: Queue,
		private timezone: string,
		private readonly lockTimeout: number,
	) {}

	/**
	 * 启动所有调度器
	 */
	start(): void {
		const enabledSources = this.sources.filter((s) => s.enabled);

		for (const source of enabledSources) {
			this.scheduleSource(source);
		}

		logger.info(
			{
				totalSources: enabledSources.length,
				timezone: this.timezone,
			},
			"Scheduler started",
		);
	}

	/**
	 * 为单个 source 创建调度
	 */
	private scheduleSource(source: SourceConfig): void {
		const cronExpr = convertToCron(source.fetchInterval);

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
		const enabledSources = this.sources.filter((s) => s.enabled);

		await Promise.allSettled(
			enabledSources.map((source) => this.collectOne(source)),
		);
	}

	/**
	 * 采集单个 source（带锁保护）
	 */
	private async collectOne(source: SourceConfig): Promise<void> {
		const startTime = Date.now();

		// 检查锁
		if (!this.acquireLock(source.name)) {
			logger.info(
				{ source: source.name },
				"Skipping - collection still running",
			);
			return;
		}

		try {
			logger.info({ source: source.name }, "Starting collection...");

			// 采集单个 source
			const items = await this.collector.collectSource(source);

			// 去重
			const newItems = await filterExistingContent(items);

			// 入队
			for (const item of newItems) {
				await this.queue.add("process", item, {
					jobId: `${item.sourceType}-${item.externalId}`,
					removeOnComplete: true,
					removeOnFail: 100,
				});
			}

			const duration = Date.now() - startTime;
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
			logger.error({ source: source.name, err }, "Collection failed");
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

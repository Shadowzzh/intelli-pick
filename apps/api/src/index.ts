// apps/api/src/index.ts
import type { Config, SourceConfig } from "@intellipick/config";
import { loadConfig } from "@intellipick/config";
import { env } from "@intellipick/env";
import { CronJob } from "cron";
import { createCollectorManager } from "./collector/index";
import { createAiClient } from "./lib/ai";
import { filterExistingContent } from "./lib/dedup";
import { createLogger } from "./lib/logger";
import { initializeProxy } from "./lib/proxy";
import { syncSources } from "./lib/sources";
import { createQueue, createWorker } from "./worker";

const logger = createLogger("main");

// Cron 转换函数：将秒数转换为 cron 表达式
function convertToCron(seconds: number): string {
	const minutes = Math.floor(seconds / 60);

	if (minutes < 1) {
		throw new Error(`fetchInterval too small: ${seconds}s (minimum 60s)`);
	}

	// 小于 60 分钟：每 N 分钟执行
	if (minutes < 60) {
		return `*/${minutes} * * * *`;
	}

	// 大于等于 60 分钟：每 N 小时执行
	const hours = Math.floor(minutes / 60);
	return `0 */${hours} * * *`;
}

async function main() {
	logger.info("Starting AI Filter...");

	const config = await loadConfig("../../config.ts");
	logger.info({ sources: config.sources.length }, "Loaded config");

	// 初始化代理
	initializeProxy(config);

	// 同步 sources 到数据库
	const sourceMap = await syncSources(config);
	logger.info({ count: sourceMap.size }, "Synced sources to database");

	// 初始化
	const ai = createAiClient(config.ai);
	const collector = createCollectorManager(sourceMap);
	const queue = createQueue(env.REDIS_URL);

	// 清空启动前的旧任务（避免 source_id 等配置变更导致的不一致）
	await queue.drain();
	logger.info("Cleared old jobs from queue");

	const worker = createWorker(env.REDIS_URL, config, ai);

	// Source 运行状态锁，防止并发执行
	const sourceLocks = new Map<string, { locked: boolean; lockedAt: Date }>();
	const LOCK_TIMEOUT = 5 * 60 * 1000; // 5分钟超时

	// 锁管理函数
	function acquireLock(sourceName: string): boolean {
		const lock = sourceLocks.get(sourceName);

		// 如果没有锁或锁已超时，允许获取
		if (
			!lock?.locked ||
			Date.now() - lock.lockedAt.getTime() > LOCK_TIMEOUT
		) {
			sourceLocks.set(sourceName, {
				locked: true,
				lockedAt: new Date(),
			});
			return true;
		}

		return false; // 锁定中
	}

	function releaseLock(sourceName: string): void {
		sourceLocks.set(sourceName, {
			locked: false,
			lockedAt: new Date(),
		});
	}

	// 采集单个 source
	async function collectOne(source: SourceConfig) {
		const startTime = Date.now();

		// 检查锁
		if (!acquireLock(source.name)) {
			logger.info(
				{ source: source.name },
				"Skipping - collection still running",
			);
			return;
		}

		try {
			logger.info({ source: source.name }, "Starting collection...");

			// 采集单个 source
			const items = await collector.collectSource(source);

			// 去重
			const newItems = await filterExistingContent(items);

			// 入队
			for (const item of newItems) {
				await queue.add("process", item, {
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
		} finally {
			releaseLock(source.name);
		}
	}

	// 获取启用的 sources
	const enabledSources = config.sources.filter((s) => s.enabled);

	// 为每个 source 创建独立的 CronJob
	const cronJobs: CronJob[] = [];

	for (const source of enabledSources) {
		const cronExpr = convertToCron(source.fetchInterval);

		const job = new CronJob(
			cronExpr,
			() => collectOne(source),
			null,
			true,
			config.scheduler.timezone,
		);

		cronJobs.push(job);
		logger.info(
			{ source: source.name, interval: source.fetchInterval, cron: cronExpr },
			"Scheduled source",
		);
	}

	logger.info(
		{
			totalSources: enabledSources.length,
			timezone: config.scheduler.timezone,
		},
		"Scheduler started",
	);

	// 首次运行所有 source
	for (const source of enabledSources) {
		collectOne(source).catch((err) => {
			logger.error(
				{ source: source.name, err },
				"Initial collection failed",
			);
		});
	}

	// 优雅关闭
	process.on("SIGTERM", async () => {
		logger.info("Shutting down...");

		// 停止所有 CronJob
		for (const job of cronJobs) {
			job.stop();
		}

		await worker.close();
		await queue.close();
		process.exit(0);
	});
}

main().catch((err) => {
	logger.error(err, "Fatal error");
	process.exit(1);
});

// apps/api/src/index.ts
import { loadConfig } from "@intellipick/config";
import { env } from "@intellipick/env";
import { CronJob } from "cron";
import { createCollectorManager } from "./collector/index";
import { createAiClient } from "./lib/ai";
import { createLogger } from "./lib/logger";
import { initializeProxy } from "./lib/proxy";
import { syncSources } from "./lib/sources";
import { createQueue, createWorker } from "./worker";

const logger = createLogger("main");

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

	// 采集任务
	async function collect() {
		logger.info("Starting collection...");
		const items = await collector.collectAll(config.sources);

		for (const item of items) {
			await queue.add("process", item, {
				jobId: `${item.sourceType}-${item.externalId}`,
				removeOnComplete: true,
				removeOnFail: 100,
			});
		}

		logger.info({ count: items.length }, "Added items to queue");
	}

	// 定时调度
	const cronJob = new CronJob(
		"0 * * * *", // 每小时
		collect,
		null,
		true,
		config.scheduler.timezone,
	);

	logger.info({ timezone: config.scheduler.timezone }, "Scheduler started");

	// 首次运行
	await collect();

	// 优雅关闭
	process.on("SIGTERM", async () => {
		logger.info("Shutting down...");
		cronJob.stop();
		await worker.close();
		await queue.close();
		process.exit(0);
	});
}

main().catch((err) => {
	logger.error(err, "Fatal error");
	process.exit(1);
});

// apps/api/src/index.ts
import { loadConfig } from "@intellipick/config";
import { env } from "@intellipick/env";
import { createCollectorManager } from "./collector/index";
import { createAiClient } from "./lib/ai";
import { createLogger } from "./lib/logger";
import { initializeProxy } from "./lib/proxy";
import { syncSources } from "./lib/sources";
import { createQueue, createWorker } from "./worker";
import { SourceScheduler } from "./scheduler";

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

	// 创建调度器
	const scheduler = new SourceScheduler(
		config.sources,
		collector,
		queue,
		config.scheduler.timezone,
	);

	// 启动调度器（创建 CronJob）
	scheduler.start();

	// 首次运行所有 source
	await scheduler.initialCollection();

	// 优雅关闭
	process.on("SIGTERM", async () => {
		logger.info("Shutting down...");
		scheduler.stop();
		await worker.close();
		await queue.close();
		process.exit(0);
	});
}

main().catch((err) => {
	logger.error(err, "Fatal error");
	process.exit(1);
});

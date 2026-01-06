// apps/api/src/index.ts
import { loadConfig } from "@ai-filter/config";
import { env } from "@ai-filter/env";
import { CronJob } from "cron";
import { createCollectorManager } from "./collector/index.js";
import { createAiClient } from "./lib/ai.js";
import { createLogger } from "./lib/logger.js";
import { createQueue, createWorker } from "./worker.js";

const logger = createLogger("main");

async function main() {
	logger.info("Starting AI Filter...");

	const config = await loadConfig("../../config.ts");
	logger.info({ sources: config.sources.length }, "Loaded config");

	// 初始化
	const ai = createAiClient(config.ai);
	const collector = createCollectorManager();
	return
	const queue = createQueue(env.REDIS_URL);
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

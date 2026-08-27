// apps/api/src/index.ts
import { loadConfig } from "@intellipick/config";
import { env } from "@intellipick/env";
import { createCollectorManager } from "./collector/index";
import { createJobsRuntime } from "./jobs/runtime";
import { syncJobSources } from "./jobs/source-sync";
import { createAiClient } from "./lib/ai";
import { createLogger } from "./lib/logger";
import { initializeProxy } from "./lib/proxy";
import { syncSources } from "./lib/sources";
import { startUptimeKumaHeartbeat } from "./lib/uptime-heartbeat";
import { SourceScheduler } from "./scheduler";
import { createQueue, createWorker } from "./worker";

const logger = createLogger("main");

async function main() {
	logger.info("Starting IntelliPick Worker...");

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
	const queue = createQueue(env.REDIS_URL, config.queue.name);

	if (env.CLEAR_QUEUE_ON_START) {
		await queue.drain();
		logger.warn("Cleared old jobs from queue");
	} else {
		logger.info("Preserved existing jobs on startup");
	}

	const worker = createWorker(env.REDIS_URL, config, ai);
	let uptimeHeartbeat: ReturnType<typeof startUptimeKumaHeartbeat> | undefined;
	if (env.UPTIME_KUMA_PUSH_URL) {
		uptimeHeartbeat = startUptimeKumaHeartbeat({
			pushUrl: env.UPTIME_KUMA_PUSH_URL,
			intervalMs: env.UPTIME_KUMA_PUSH_INTERVAL_SECONDS * 1000,
			timeoutMs: env.UPTIME_KUMA_PUSH_TIMEOUT_MS,
			logger,
		});
		logger.info(
			{ intervalSeconds: env.UPTIME_KUMA_PUSH_INTERVAL_SECONDS },
			"Uptime Kuma Worker heartbeat enabled",
		);
	} else {
		logger.info("Uptime Kuma Worker heartbeat disabled");
	}
	let jobsRuntime: ReturnType<typeof createJobsRuntime> | undefined;

	if (config.jobs?.enabled) {
		const jobSourceMap = await syncJobSources(config.jobs);
		jobsRuntime = createJobsRuntime({
			redisUrl: env.REDIS_URL,
			config: config.jobs,
			sourceMap: jobSourceMap,
			ai,
			timezone: config.scheduler.timezone,
			logger,
		});

		if (config.jobs.runInitialCollection) {
			await jobsRuntime.initialCollection();
		}
		await jobsRuntime.backfillMissingCategories();
	}

	// 创建调度器
	const scheduler = new SourceScheduler(
		config.sources,
		sourceMap,
		collector,
		queue,
		config.scheduler.timezone,
		config.scheduler.lockTimeout,
	);

	// 启动调度器（创建 CronJob）
	scheduler.start();

	if (env.RUN_INITIAL_COLLECTION) {
		await scheduler.initialCollection();
	} else {
		logger.info("Skipped initial collection on startup");
	}

	// 优雅关闭
	process.on("SIGTERM", async () => {
		logger.info("Shutting down...");
		uptimeHeartbeat?.stop();
		scheduler.stop();
		jobsRuntime?.stopScheduler();
		await worker.close();
		await queue.close();
		await jobsRuntime?.worker.close();
		await jobsRuntime?.queue.close();
		process.exit(0);
	});
}

main().catch((err) => {
	logger.error(err, "Fatal error");
	process.exit(1);
});

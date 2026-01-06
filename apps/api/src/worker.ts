import type { Config } from "@ai-filter/config";
import type { RawContent } from "@ai-filter/shared";
// apps/api/src/worker.ts
import { Queue, Worker } from "bullmq";
import type { AiClient } from "./lib/ai";
import { createLogger } from "./lib/logger";
import { Pipeline } from "./pipeline/index";

const logger = createLogger("worker");

const QUEUE_NAME = "ai-filter-pipeline";

export function createQueue(redisUrl: string) {
	return new Queue<RawContent>(QUEUE_NAME, {
		connection: { url: redisUrl },
	});
}

export function createWorker(
	redisUrl: string,
	config: Config,
	ai: AiClient,
): Worker {
	const pipeline = new Pipeline(config, ai);

	const worker = new Worker<RawContent>(
		QUEUE_NAME,
		async (job) => {
			logger.info({ jobId: job.id, url: job.data.url }, "Processing job");
			const success = await pipeline.process(job.data);
			return { success };
		},
		{
			connection: { url: redisUrl },
			concurrency: 5,
		},
	);

	worker.on("completed", (job, result) => {
		logger.info({ jobId: job.id, success: result.success }, "Job completed");
	});

	worker.on("failed", (job, err) => {
		logger.error({ jobId: job?.id, err }, "Job failed");
	});

	return worker;
}

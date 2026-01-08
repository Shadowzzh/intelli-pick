import type { Config } from "@intellipick/config";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/worker.ts
import { Queue, Worker } from "bullmq";
import type { AiClient } from "./lib/ai";
import { createLogger, createRequestLogger } from "./lib/logger";
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
			const jobId = job.id as string;
			const jobLogger = createRequestLogger("worker", jobId);

			jobLogger.info({ jobId, url: job.data.url }, "Processing job");

			const success = await pipeline.process(job.data, jobId);
			return { success };
		},
		{
			connection: { url: redisUrl },
			concurrency: config.queue.concurrency,
			limiter: {
				max: config.queue.rateLimit.max,
				duration: config.queue.rateLimit.duration,
			},
			settings: {
				backoffStrategy: (attemptsMade: number) => {
					const { type, delay } = config.queue.retry.backoff;
					return type === "exponential"
						? delay * 2 ** attemptsMade // 失败一次，不是立刻再试，而是等得越来越久再试。
						: delay;
				},
			},
		},
	);

	worker.on("completed", (job, result) => {
		const jobId = job.id as string;
		const jobLogger = createRequestLogger("worker", jobId);
		jobLogger.info(
			{ jobId, url: job.data.url, success: result.success },
			"Job completed",
		);
	});

	worker.on("failed", (job, err) => {
		const jobId = job?.id as string;
		const jobLogger = createRequestLogger("worker", jobId || "unknown");
		jobLogger.error({ jobId, url: job?.data.url, err }, "Job failed");
	});

	return worker;
}

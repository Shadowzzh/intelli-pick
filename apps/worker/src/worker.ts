import type { Config } from "@intellipick/config";
import { db, jobHistory } from "@intellipick/db";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/worker.ts
import { Queue, Worker } from "bullmq";
import type { AiClient } from "./lib/ai";
import { createLogger, createRequestLogger } from "./lib/logger";
import { Pipeline } from "./pipeline/index";

const logger = createLogger("worker");

export function createQueue(redisUrl: string, queueName: string) {
	return new Queue<RawContent>(queueName, {
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
		config.queue.name,
		async (job) => {
			const jobId = job.id as string;
			const jobLogger = createRequestLogger("worker", jobId);

			jobLogger.info({ jobId, url: job.data.url }, "Processing job");

			return pipeline.process(job.data, jobId);
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

	worker.on("completed", async (job, result) => {
		const jobId = job.id as string;
		const jobLogger = createRequestLogger("worker", jobId);
		jobLogger.info(
			{ jobId, url: job.data.url, success: result.success },
			"Job completed",
		);

		// 记录任务历史到数据库
		try {
			await db.insert(jobHistory).values({
				jobId: jobId,
				jobName: job.name || "process",
				sourceType: job.data.sourceType,
				url: job.data.url,
				externalId: job.data.externalId,
				status: "completed",
				success: result.success,
				startedAt: job.processedOn ? new Date(job.processedOn) : new Date(),
				finishedAt: job.finishedOn ? new Date(job.finishedOn) : new Date(),
				duration:
					job.finishedOn && job.processedOn
						? job.finishedOn - job.processedOn
						: null,
				returnValue: result,
			});
		} catch (err) {
			jobLogger.error({ err }, "Failed to save job history");
		}
	});

	worker.on("failed", async (job, err) => {
		const jobId = job?.id as string;
		const jobLogger = createRequestLogger("worker", jobId || "unknown");
		jobLogger.error({ jobId, url: job?.data.url, err }, "Job failed");

		// 记录失败任务历史到数据库
		if (job) {
			try {
				await db.insert(jobHistory).values({
					jobId: jobId,
					jobName: job.name || "process",
					sourceType: job.data?.sourceType,
					url: job.data?.url,
					externalId: job.data?.externalId,
					status: "failed",
					success: false,
					startedAt: job.processedOn ? new Date(job.processedOn) : new Date(),
					finishedAt: job.finishedOn ? new Date(job.finishedOn) : new Date(),
					duration:
						job.finishedOn && job.processedOn
							? job.finishedOn - job.processedOn
							: null,
					failedReason: err.message,
					stacktrace: err.stack,
				});
			} catch (dbErr) {
				jobLogger.error({ err: dbErr }, "Failed to save job history");
			}
		}
	});

	return worker;
}

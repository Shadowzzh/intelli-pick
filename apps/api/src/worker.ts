// apps/api/src/worker.ts
import { Worker, Queue } from "bullmq";
import type { RawContent } from "@ai-filter/shared";
import type { Config } from "./lib/config.js";
import type { AiClient } from "./lib/ai.js";
import { Pipeline } from "./pipeline/index.js";
import { createLogger } from "./lib/logger.js";

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
  ai: AiClient
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
    }
  );

  worker.on("completed", (job, result) => {
    logger.info({ jobId: job.id, success: result.success }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Job failed");
  });

  return worker;
}

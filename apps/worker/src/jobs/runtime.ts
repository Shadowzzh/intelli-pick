import type { AiClient } from "@intellipick/ai";
import type { JobSourceConfig, JobsConfig } from "@intellipick/config";
import { db, jobPostings, jobSources } from "@intellipick/db";
import { type Queue, Worker } from "bullmq";
import { Queue as BullQueue } from "bullmq";
import { CronJob } from "cron";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { Logger } from "pino";
import { convertToCron } from "../scheduler/cron-converter";
import { collectJobSource } from "./collector";
import { processJobPosting } from "./processor";
import type { JobProcessingResult, RawJobPosting } from "./types";

interface JobsRuntime {
	queue: Queue<RawJobPosting>;
	worker: Worker<RawJobPosting, JobProcessingResult>;
	stopScheduler: () => void;
	initialCollection: () => Promise<void>;
	backfillMissingCategories: () => Promise<number>;
}

function createStableJobId(raw: RawJobPosting): string {
	const safeExternalId = raw.externalId.replace(/[^a-zA-Z0-9_-]/g, "-");
	return `${raw.sourceKey}-${safeExternalId}`;
}

export function createJobsRuntime(params: {
	redisUrl: string;
	config: JobsConfig;
	sourceMap: Map<string, string>;
	ai: AiClient;
	timezone: string;
	logger: Logger;
}): JobsRuntime {
	const { redisUrl, config, sourceMap, ai, timezone, logger } = params;
	const queue = new BullQueue<RawJobPosting>(config.queueName, {
		connection: { url: redisUrl },
	});
	const worker = new Worker<RawJobPosting, JobProcessingResult>(
		config.queueName,
		async (job) => processJobPosting(job.data, ai),
		{
			connection: { url: redisUrl },
			concurrency: config.concurrency,
		},
	);
	const cronJobs: CronJob[] = [];

	worker.on("completed", (job, result) => {
		logger.info(
			{ jobId: job.id, url: job.data.url, stored: result.stored },
			"Job posting processing completed",
		);
	});

	worker.on("failed", (job, error) => {
		logger.error(
			{ jobId: job?.id, url: job?.data.url, error },
			"Job posting processing failed",
		);
	});

	async function collectOne(source: JobSourceConfig): Promise<void> {
		const sourceId = sourceMap.get(source.key);
		if (!sourceId) {
			throw new Error(`Job source ${source.key} was not synchronized`);
		}

		try {
			const items = await collectJobSource(source, sourceId);
			const externalIds = items.map((item) => item.externalId);
			const urls = items.map((item) => item.url);
			let existing: { externalId: string; url: string }[] = [];

			if (items.length > 0) {
				existing = await db
					.select({
						externalId: jobPostings.externalId,
						url: jobPostings.url,
					})
					.from(jobPostings)
					.where(
						or(
							and(
								eq(jobPostings.sourceId, sourceId),
								inArray(jobPostings.externalId, externalIds),
							),
							inArray(jobPostings.url, urls),
						),
					);
			}

			const existingIds = new Set(existing.map((item) => item.externalId));
			const existingUrls = new Set(existing.map((item) => item.url));
			const newItems = items.filter(
				(item) =>
					!existingIds.has(item.externalId) && !existingUrls.has(item.url),
			);

			for (const item of newItems) {
				await queue.add("extract-job", item, {
					jobId: createStableJobId(item),
					attempts: 2,
					backoff: { type: "exponential", delay: 5000 },
					removeOnComplete: 1000,
					removeOnFail: 1000,
				});
			}

			await db
				.update(jobSources)
				.set({
					lastFetchedAt: new Date(),
					lastFetchStatus: "success",
					lastFetchError: null,
					updatedAt: new Date(),
				})
				.where(eq(jobSources.id, sourceId));

			logger.info(
				{
					source: source.name,
					collected: items.length,
					queued: newItems.length,
				},
				"Job source collection completed",
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await db
				.update(jobSources)
				.set({
					lastFetchStatus: "failed",
					lastFetchError: message,
					updatedAt: new Date(),
				})
				.where(eq(jobSources.id, sourceId));
			logger.error(
				{ source: source.name, error: message },
				"Job source collection failed",
			);
		}
	}

	async function backfillMissingCategories(): Promise<number> {
		const postings = await db
			.select({
				id: jobPostings.id,
				sourceId: jobPostings.sourceId,
				sourceKey: jobSources.key,
				externalId: jobPostings.externalId,
				url: jobPostings.url,
				title: jobPostings.title,
				rawContent: jobPostings.rawContent,
				rawData: jobPostings.rawData,
				publishedAt: jobPostings.publishedAt,
				collectedAt: jobPostings.collectedAt,
			})
			.from(jobPostings)
			.innerJoin(jobSources, eq(jobPostings.sourceId, jobSources.id))
			.where(
				and(
					eq(jobPostings.status, "active"),
					sql`jsonb_array_length(${jobPostings.roleCategories}) = 0`,
				),
			);

		for (const posting of postings) {
			const raw: RawJobPosting = {
				sourceId: posting.sourceId,
				sourceKey: posting.sourceKey,
				externalId: posting.externalId,
				url: posting.url,
				title: posting.title,
				author: null,
				content: posting.rawContent,
				publishedAt: posting.publishedAt?.toISOString() || null,
				collectedAt: posting.collectedAt.toISOString(),
				rawData: {
					...(posting.rawData || {}),
					backfill: true,
					backfillPostingId: posting.id,
				},
			};
			await queue.add("backfill-job-categories", raw, {
				jobId: `role-categories-v2-${posting.id}`,
				attempts: 2,
				backoff: { type: "exponential", delay: 5000 },
				removeOnComplete: 1000,
				removeOnFail: 1000,
			});
		}

		logger.info(
			{ count: postings.length },
			"Queued job role category backfill",
		);
		return postings.length;
	}

	for (const source of config.sources.filter((item) => item.enabled)) {
		const cron = convertToCron(source.fetchInterval);
		cronJobs.push(
			new CronJob(cron, () => collectOne(source), null, true, timezone),
		);
		logger.info(
			{ source: source.name, interval: source.fetchInterval, cron },
			"Scheduled job source",
		);
	}

	return {
		queue,
		worker,
		stopScheduler: () => {
			for (const job of cronJobs) {
				job.stop();
			}
		},
		initialCollection: async () => {
			await Promise.allSettled(
				config.sources
					.filter((source) => source.enabled)
					.map((source) => collectOne(source)),
			);
		},
		backfillMissingCategories,
	};
}

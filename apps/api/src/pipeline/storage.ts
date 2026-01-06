import type { Config } from "@ai-filter/config";
// apps/api/src/pipeline/storage.ts
import {
	contents,
	db,
	entities,
	entityMentions,
	quarantine,
} from "@ai-filter/db";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { createLogger } from "../lib/logger";
import type { PipelineContext, PipelineStep } from "./types";

const logger = createLogger("storage");

export class StorageStep implements PipelineStep {
	name = "storage";

	constructor(private config: Config["filter"]) {}

	async process(ctx: PipelineContext): Promise<PipelineContext | null> {
		const { raw, filterResult, extractResult } = ctx;

		// 处理 quarantine
		if (filterResult?.decision === "quarantine") {
			await db.insert(quarantine).values({
				sourceId: raw.sourceId,
				externalId: raw.externalId,
				url: raw.url,
				author: raw.author,
				rawContent: raw.content,
				filterVersion: this.config.promptVersion,
				decision: filterResult.decision,
				valueScore: filterResult.valueScore,
				noiseScore: filterResult.noiseScore,
				safety: filterResult.safety,
				reasons: filterResult.reasons,
				signals: filterResult.signals,
				oneLineWhy: filterResult.oneLineWhy,
				expiresAt: dayjs().add(this.config.quarantineTTLDays, "day").toDate(),
			});

			logger.info({ externalId: raw.externalId }, "Stored in quarantine");
			return ctx;
		}

		// 存储内容
		const [content] = await db
			.insert(contents)
			.values({
				sourceId: raw.sourceId,
				externalId: raw.externalId,
				url: raw.url,
				author: raw.author,
				rawContent: raw.content,
				title: extractResult?.title,
				summary: extractResult?.summary,
				keyPoints: extractResult?.keyPoints,
				dataPoints: extractResult?.dataPoints,
				contentType: "single",
				category: extractResult?.category,
				tags: extractResult?.tags,
				filterVersion: this.config.promptVersion,
				filterResult: filterResult,
				publishedAt: raw.publishedAt,
			})
			.returning();

		logger.info(
			{ contentId: content.id, title: content.title },
			"Stored content",
		);

		// 存储实体和关联
		if (extractResult?.entities) {
			for (const entity of extractResult.entities) {
				// 查找或创建实体
				let existingEntity = await db.query.entities.findFirst({
					where: eq(entities.name, entity.name),
				});

				if (existingEntity) {
					// 更新 mentionCount
					await db
						.update(entities)
						.set({
							mentionCount: (existingEntity.mentionCount || 0) + 1,
							lastMentionedAt: new Date(),
						})
						.where(eq(entities.id, existingEntity.id));
				} else {
					// 创建新实体
					const [newEntity] = await db
						.insert(entities)
						.values({
							name: entity.name,
							type: entity.type,
							url: entity.url,
							description: entity.description,
							mentionCount: 1,
							firstMentionedAt: new Date(),
							lastMentionedAt: new Date(),
						})
						.returning();
					existingEntity = newEntity;
				}

				// 创建关联
				await db.insert(entityMentions).values({
					entityId: existingEntity.id,
					contentId: content.id,
					sourceId: raw.sourceId,
				});
			}
		}

		return ctx;
	}
}

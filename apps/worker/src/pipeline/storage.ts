// apps/api/src/pipeline/storage.ts
import { contents, db, entities, entityMentions } from "@intellipick/db";
import {
	emitEntityUpdate,
	emitNewContent,
	emitStatsUpdate,
} from "@intellipick/events";
import { eq } from "drizzle-orm";
import type { Logger } from "pino";
import { recordDuplicateCandidates } from "../lib/duplicate-candidates";
import { createLogger } from "../lib/logger";
import { getContentStats } from "./content-stats";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("storage");

export class StorageStep implements PipelineStep {
	name = "storage";

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;
		const { raw, extractResult } = ctx;

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
				// publishedAt 是 UTC ISO 字符串，需要转换为 Date 对象
				publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
			})
			.onConflictDoNothing({
				target: [contents.sourceId, contents.externalId],
			})
			.returning();
		if (!content) {
			log.info(
				{ url: raw.url, sourceId: raw.sourceId, externalId: raw.externalId },
				"Skipped concurrent duplicate content",
			);
			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		}

		log.info(
			{ url: raw.url, contentId: content.id, title: content.title },
			"Stored content",
		);

		// 发送新内容事件
		emitNewContent(content);

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

					// 发送实体更新事件
					emitEntityUpdate(existingEntity);
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

					// 发送实体更新事件
					emitEntityUpdate(newEntity);
				}

				// 创建关联
				await db.insert(entityMentions).values({
					entityId: existingEntity.id,
					contentId: content.id,
					sourceId: raw.sourceId,
				});
			}
		}

		try {
			const duplicateCandidates = await recordDuplicateCandidates({
				content,
				sourceName: raw.sourceName,
			});
			if (duplicateCandidates.detected > 0) {
				log.info(
					{
						contentId: content.id,
						...duplicateCandidates,
					},
					"Recorded duplicate candidates",
				);
			}
		} catch (error) {
			log.error(
				{ contentId: content.id, error },
				"Failed to record duplicate candidates",
			);
		}

		// 统计与 API 首页口径一致：全局内容总数和上海自然日内的新增入库数。
		const stats = await getContentStats();
		emitStatsUpdate(stats);

		return {
			status: StepStatus.Continue,
			context: ctx,
		};
	}
}

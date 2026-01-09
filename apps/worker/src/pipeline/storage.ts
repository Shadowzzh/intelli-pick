import type { Config } from "@intellipick/config";
// apps/api/src/pipeline/storage.ts
import {
	contents,
	db,
	entities,
	entityMentions,
	quarantine,
} from "@intellipick/db";
import {
	emitEntityUpdate,
	emitNewContent,
	emitStatsUpdate,
} from "@intellipick/events";
import { toUTCISOString } from "@intellipick/shared";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import type { Logger } from "pino";
import { createLogger } from "../lib/logger";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("storage");

export class StorageStep implements PipelineStep {
	name = "storage";

	constructor(private config: Config["filter"]) {}

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;
		const { raw, filterResult, extractResult } = ctx;

		// 处理 quarantine
		if (filterResult?.decision === "quarantine") {
			// 检查是否已存在相同的记录
			const existing = await db.query.quarantine.findFirst({
				where: and(
					eq(quarantine.sourceId, raw.sourceId),
					eq(quarantine.externalId, raw.externalId),
				),
			});

			const quarantineData = {
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
			};

			if (existing) {
				// 更新已存在的记录
				await db
					.update(quarantine)
					.set({
						...quarantineData,
						createdAt: existing.createdAt, // 保持原创建时间
					})
					.where(eq(quarantine.id, existing.id));

				log.info(
					{ url: raw.url, externalId: raw.externalId },
					"Updated quarantine record",
				);
			} else {
				// 插入新记录
				await db.insert(quarantine).values(quarantineData);

				log.info(
					{ url: raw.url, externalId: raw.externalId },
					"Stored in quarantine",
				);
			}

			return {
				status: StepStatus.Continue,
				context: ctx,
			};
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
				// publishedAt 是 UTC ISO 字符串，需要转换为 Date 对象
				publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
			})
			.returning();

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

		// 发送统计更新事件
		const stats = {
			totalContents: await db
				.select()
				.from(contents)
				.then((rows) => rows.length),
			todayNew: await db
				.select()
				.from(contents)
				.where(eq(contents.sourceId, raw.sourceId))
				.then(
					(rows) =>
						rows.filter(
							(r) =>
								r.publishedAt && dayjs(r.publishedAt).isSame(dayjs(), "day"),
						).length,
				),
		};
		emitStatsUpdate(stats);

		return {
			status: StepStatus.Continue,
			context: ctx,
		};
	}
}

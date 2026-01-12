// apps/api/src/repositories/entities.repository.ts
import { entityMentions } from "@intellipick/db";
import { entities } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

export class EntitiesRepository {
	constructor(private db: Database) {}

	async findById(id: string) {
		const [result] = await this.db
			.select()
			.from(entities)
			.where(eq(entities.id, id))
			.limit(1);
		return result;
	}

	async findByType(options: {
		type: string;
		limit: number;
		offset: number;
	}) {
		return this.db
			.select()
			.from(entities)
			.where(eq(entities.type, options.type))
			.orderBy(desc(entities.mentionCount))
			.limit(options.limit)
			.offset(options.offset);
	}

	async findTrending(options: {
		limit: number;
		offset: number;
		lastMentionedAfter?: Date;
		lastMentionedBefore?: Date;
		category?: string;
		sourceIds?: string[];
		tags?: string[];
	}) {
		// 如果有任何 content 筛选条件，需要 JOIN contents 表
		const needsContentJoin =
			options.category || options.sourceIds || options.tags;

		if (needsContentJoin) {
			const { contents } = await import("@intellipick/db");
			const conditions = [];

			// 分类筛选
			if (options.category) {
				conditions.push(eq(contents.category, options.category));
			}

			// 数据源筛选
			if (options.sourceIds && options.sourceIds.length > 0) {
				conditions.push(inArray(contents.sourceId, options.sourceIds));
			}

			// 标签筛选
			if (options.tags && options.tags.length > 0) {
				const tagsList = options.tags
					.map((tag) => `'${tag.replace(/'/g, "''")}'`)
					.join(", ");
				conditions.push(
					sql`EXISTS (
						SELECT 1
						FROM jsonb_array_elements_text(${contents.tags}) AS tag
						WHERE tag IN (${sql.raw(tagsList)})
					)`,
				);
			}

			// 日期筛选
			if (options.lastMentionedAfter) {
				conditions.push(
					gte(entities.lastMentionedAt, options.lastMentionedAfter),
				);
			}

			if (options.lastMentionedBefore) {
				conditions.push(
					lte(entities.lastMentionedAt, options.lastMentionedBefore),
				);
			}

			const where = and(...conditions);

			// 通过 entity_mentions 和 contents 表关联
			return this.db
				.selectDistinct({
					id: entities.id,
					name: entities.name,
					type: entities.type,
					url: entities.url,
					description: entities.description,
					mentionCount: entities.mentionCount,
					metadata: entities.metadata,
					createdAt: entities.createdAt,
					firstMentionedAt: entities.firstMentionedAt,
					lastMentionedAt: entities.lastMentionedAt,
				})
				.from(entities)
				.innerJoin(entityMentions, eq(entityMentions.entityId, entities.id))
				.innerJoin(contents, eq(contents.id, entityMentions.contentId))
				.where(where)
				.orderBy(desc(entities.mentionCount))
				.limit(options.limit)
				.offset(options.offset);
		}

		// 没有 content 筛选时，保持原有逻辑
		const conditions = [];

		if (options.lastMentionedAfter) {
			conditions.push(
				gte(entities.lastMentionedAt, options.lastMentionedAfter),
			);
		}

		if (options.lastMentionedBefore) {
			conditions.push(
				lte(entities.lastMentionedAt, options.lastMentionedBefore),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		return this.db
			.select()
			.from(entities)
			.where(where || sql`1=1`)
			.orderBy(desc(entities.mentionCount))
			.limit(options.limit)
			.offset(options.offset);
	}

	async countByType(type: string): Promise<number> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(entities)
			.where(eq(entities.type, type));
		return result.count;
	}

	async count(options?: {
		lastMentionedAfter?: Date;
		lastMentionedBefore?: Date;
		category?: string;
		sourceIds?: string[];
		tags?: string[];
	}): Promise<number> {
		// 如果有任何 content 筛选条件，需要 JOIN contents 表
		const needsContentJoin =
			options?.category || options?.sourceIds || options?.tags;

		if (needsContentJoin) {
			const { contents } = await import("@intellipick/db");
			const conditions = [];

			if (options.category) {
				conditions.push(eq(contents.category, options.category));
			}

			if (options.sourceIds && options.sourceIds.length > 0) {
				conditions.push(inArray(contents.sourceId, options.sourceIds));
			}

			if (options.tags && options.tags.length > 0) {
				const tagsList = options.tags
					.map((tag) => `'${tag.replace(/'/g, "''")}'`)
					.join(", ");
				conditions.push(
					sql`EXISTS (
						SELECT 1
						FROM jsonb_array_elements_text(${contents.tags}) AS tag
						WHERE tag IN (${sql.raw(tagsList)})
					)`,
				);
			}

			if (options.lastMentionedAfter) {
				conditions.push(
					gte(entities.lastMentionedAt, options.lastMentionedAfter),
				);
			}

			if (options.lastMentionedBefore) {
				conditions.push(
					lte(entities.lastMentionedAt, options.lastMentionedBefore),
				);
			}

			const where = and(...conditions);

			// COUNT DISTINCT entities
			const [result] = await this.db
				.selectDistinct({ count: sql<number>`count(DISTINCT ${entities.id})` })
				.from(entities)
				.innerJoin(entityMentions, eq(entityMentions.entityId, entities.id))
				.innerJoin(contents, eq(contents.id, entityMentions.contentId))
				.where(where);

			return result.count;
		}

		// 没有 content 筛选时，保持原有逻辑
		const conditions = [];

		if (options?.lastMentionedAfter) {
			conditions.push(
				gte(entities.lastMentionedAt, options.lastMentionedAfter),
			);
		}

		if (options?.lastMentionedBefore) {
			conditions.push(
				lte(entities.lastMentionedAt, options.lastMentionedBefore),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(entities)
			.where(where || sql`1=1`);
		return result.count;
	}

	async findByContentId(contentId: string) {
		return this.db
			.select({
				id: entities.id,
				name: entities.name,
				type: entities.type,
				url: entities.url,
				description: entities.description,
				mentionCount: entities.mentionCount,
				metadata: entities.metadata,
				firstMentionedAt: entities.firstMentionedAt,
				lastMentionedAt: entities.lastMentionedAt,
			})
			.from(entities)
			.innerJoin(entityMentions, eq(entityMentions.entityId, entities.id))
			.where(eq(entityMentions.contentId, contentId));
	}

	async findContentsByEntityId(params: {
		entityId: string;
		limit: number;
		offset: number;
		publishedAfter?: Date;
		publishedBefore?: Date;
	}) {
		const { contents } = await import("@intellipick/db");
		const conditions = [eq(entityMentions.entityId, params.entityId)];

		if (params.publishedAfter) {
			conditions.push(gte(contents.publishedAt, params.publishedAfter));
		}

		if (params.publishedBefore) {
			conditions.push(lte(contents.publishedAt, params.publishedBefore));
		}

		const where = and(...conditions);

		const results = await this.db
			.select({
				id: contents.id,
				title: contents.title,
				summary: contents.summary,
				url: contents.url,
				author: contents.author,
				publishedAt: contents.publishedAt,
				collectedAt: contents.collectedAt,
				category: contents.category,
				tags: contents.tags,
			})
			.from(contents)
			.innerJoin(entityMentions, eq(entityMentions.contentId, contents.id))
			.where(where)
			.orderBy(desc(contents.publishedAt))
			.limit(params.limit)
			.offset(params.offset);

		return results;
	}

	async countContentsByEntityId(params: {
		entityId: string;
		publishedAfter?: Date;
		publishedBefore?: Date;
	}): Promise<number> {
		const { contents } = await import("@intellipick/db");
		const conditions = [eq(entityMentions.entityId, params.entityId)];

		if (params.publishedAfter) {
			conditions.push(gte(contents.publishedAt, params.publishedAfter));
		}

		if (params.publishedBefore) {
			conditions.push(lte(contents.publishedAt, params.publishedBefore));
		}

		const where = and(...conditions);

		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(contents)
			.innerJoin(entityMentions, eq(entityMentions.contentId, contents.id))
			.where(where);

		return result.count;
	}
}

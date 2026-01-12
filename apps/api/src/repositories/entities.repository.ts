// apps/api/src/repositories/entities.repository.ts
import { entityMentions } from "@intellipick/db";
import { entities } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

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
	}) {
		// 如果有 category 筛选，需要 JOIN contents 表
		if (options.category) {
			const { contents } = await import("@intellipick/db");
			const conditions = [eq(contents.category, options.category)];

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

			// 通过 entity_mentions 和 contents 表关联，筛选该分类下的实体
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

		// 没有 category 筛选时，保持原有逻辑
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
	}): Promise<number> {
		// 如果有 category 筛选，需要 JOIN contents 表
		if (options?.category) {
			const { contents } = await import("@intellipick/db");
			const conditions = [eq(contents.category, options.category)];

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

		// 没有 category 筛选时，保持原有逻辑
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

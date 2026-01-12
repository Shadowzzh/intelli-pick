// apps/api/src/repositories/contents.repository.ts
import { contents, sources } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import {
	type SQL,
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	lte,
	sql,
} from "drizzle-orm";

export class ContentsRepository {
	constructor(private db: Database) {}

	async findById(id: string) {
		const [result] = await this.db
			.select()
			.from(contents)
			.where(eq(contents.id, id))
			.limit(1);
		return result;
	}

	async findWithFilters(filters: {
		category?: string;
		tags?: string[];
		sourceIds?: string[];
		publishedAfter?: Date;
		publishedBefore?: Date;
		search?: string;
		entityIds?: string[];
		limit: number;
		offset: number;
		orderBy?: { column: string; direction: "asc" | "desc" };
	}) {
		// 如果有 entityIds 筛选，需要 JOIN entity_mentions 表
		if (filters.entityIds && filters.entityIds.length > 0) {
			const { entityMentions } = await import("@intellipick/db");
			const conditions = [];

			// 实体筛选：content 必须提到这些实体中的任意一个
			const entityIdsList = filters.entityIds
				.map((id) => `'${id.replace(/'/g, "''")}'`)
				.join(", ");
			conditions.push(
				sql`${entityMentions.entityId} IN (${sql.raw(entityIdsList)})`,
			);

			if (filters.category) {
				conditions.push(eq(contents.category, filters.category));
			}

			if (filters.tags && filters.tags.length > 0) {
				const tagsList = filters.tags
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

			if (filters.sourceIds && filters.sourceIds.length > 0) {
				conditions.push(inArray(contents.sourceId, filters.sourceIds));
			}

			if (filters.publishedAfter) {
				conditions.push(gte(contents.publishedAt, filters.publishedAfter));
			}

			if (filters.publishedBefore) {
				conditions.push(lte(contents.publishedAt, filters.publishedBefore));
			}

			if (filters.search) {
				const searchPattern = `%${filters.search}%`;
				conditions.push(
					sql`(
						${contents.title} ILIKE ${searchPattern}
						OR ${contents.summary} ILIKE ${searchPattern}
					)`,
				);
			}

			const where = and(...conditions);

			let orderBySql: SQL;
			if (filters.orderBy) {
				const column =
					contents[filters.orderBy.column as keyof typeof contents];
				orderBySql =
					filters.orderBy.direction === "asc"
						? asc(sql`${column}`)
						: desc(sql`${column}`);
			} else {
				orderBySql = desc(contents.publishedAt);
			}

			// 使用 DISTINCT 避免 JOIN 产生的重复内容，只选择 contents 表字段
			return this.db
				.selectDistinctOn([contents.id], {
					id: contents.id,
					sourceId: contents.sourceId,
					externalId: contents.externalId,
					url: contents.url,
					author: contents.author,
					rawContent: contents.rawContent,
					title: contents.title,
					summary: contents.summary,
					keyPoints: contents.keyPoints,
					dataPoints: contents.dataPoints,
					contentType: contents.contentType,
					category: contents.category,
					tags: contents.tags,
					filterVersion: contents.filterVersion,
					filterResult: contents.filterResult,
					publishedAt: contents.publishedAt,
					collectedAt: contents.collectedAt,
					createdAt: contents.createdAt,
				})
				.from(contents)
				.innerJoin(entityMentions, eq(entityMentions.contentId, contents.id))
				.where(where)
				.orderBy(contents.id, orderBySql)
				.limit(filters.limit)
				.offset(filters.offset);
		}

		// 没有 entityIds 筛选时，保持原有逻辑
		const conditions = [];

		if (filters.category) {
			conditions.push(eq(contents.category, filters.category));
		}

		if (filters.tags && filters.tags.length > 0) {
			// For jsonb array, check if any of the filter tags exist in the content's tags
			// Build an IN clause with the tags
			const tagsList = filters.tags
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

		if (filters.sourceIds && filters.sourceIds.length > 0) {
			conditions.push(inArray(contents.sourceId, filters.sourceIds));
		}

		if (filters.publishedAfter) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, filters.publishedAfter));
		}

		if (filters.publishedBefore) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, filters.publishedBefore));
		}

		if (filters.search) {
			// 使用 ILIKE 进行不区分大小写的搜索
			// 搜索 title 和 summary 字段
			const searchPattern = `%${filters.search}%`;
			conditions.push(
				sql`(
					${contents.title} ILIKE ${searchPattern}
					OR ${contents.summary} ILIKE ${searchPattern}
				)`,
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		let orderBySql: SQL;
		if (filters.orderBy) {
			const column = contents[filters.orderBy.column as keyof typeof contents];
			orderBySql =
				filters.orderBy.direction === "asc"
					? asc(sql`${column}`)
					: desc(sql`${column}`);
		} else {
			orderBySql = desc(contents.publishedAt);
		}

		return this.db
			.select()
			.from(contents)
			.where(where || sql`1=1`)
			.orderBy(orderBySql)
			.limit(filters.limit)
			.offset(filters.offset);
	}

	async countWithFilters(filters: {
		category?: string;
		tags?: string[];
		sourceIds?: string[];
		publishedAfter?: Date;
		publishedBefore?: Date;
		search?: string;
		entityIds?: string[];
	}): Promise<number> {
		// 如果有 entityIds 筛选，需要 JOIN entity_mentions 表
		if (filters.entityIds && filters.entityIds.length > 0) {
			const { entityMentions } = await import("@intellipick/db");
			const conditions = [];

			// 实体筛选：content 必须提到这些实体中的任意一个
			const entityIdsList = filters.entityIds
				.map((id) => `'${id.replace(/'/g, "''")}'`)
				.join(", ");
			conditions.push(
				sql`${entityMentions.entityId} IN (${sql.raw(entityIdsList)})`,
			);

			if (filters.category) {
				conditions.push(eq(contents.category, filters.category));
			}

			if (filters.tags && filters.tags.length > 0) {
				const tagsList = filters.tags
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

			if (filters.sourceIds && filters.sourceIds.length > 0) {
				conditions.push(inArray(contents.sourceId, filters.sourceIds));
			}

			if (filters.publishedAfter) {
				conditions.push(gte(contents.publishedAt, filters.publishedAfter));
			}

			if (filters.publishedBefore) {
				conditions.push(lte(contents.publishedAt, filters.publishedBefore));
			}

			if (filters.search) {
				const searchPattern = `%${filters.search}%`;
				conditions.push(
					sql`(
						${contents.title} ILIKE ${searchPattern}
						OR ${contents.summary} ILIKE ${searchPattern}
					)`,
				);
			}

			const where = and(...conditions);

			// COUNT DISTINCT contents
			const [result] = await this.db
				.select({ count: sql<number>`count(DISTINCT ${contents.id})` })
				.from(contents)
				.innerJoin(entityMentions, eq(entityMentions.contentId, contents.id))
				.where(where);

			return result.count;
		}

		// 没有 entityIds 筛选时，保持原有逻辑
		const conditions = [];

		if (filters.category) {
			conditions.push(eq(contents.category, filters.category));
		}

		if (filters.tags && filters.tags.length > 0) {
			// For jsonb array, check if any of the filter tags exist in the content's tags
			// Build an IN clause with the tags
			const tagsList = filters.tags
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

		if (filters.sourceIds && filters.sourceIds.length > 0) {
			conditions.push(inArray(contents.sourceId, filters.sourceIds));
		}

		if (filters.publishedAfter) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, filters.publishedAfter));
		}

		if (filters.publishedBefore) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, filters.publishedBefore));
		}

		if (filters.search) {
			// 使用 ILIKE 进行不区分大小写的搜索
			// 搜索 title 和 summary 字段
			const searchPattern = `%${filters.search}%`;
			conditions.push(
				sql`(
					${contents.title} ILIKE ${searchPattern}
					OR ${contents.summary} ILIKE ${searchPattern}
				)`,
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(contents)
			.where(where || sql`1=1`);
		return result.count;
	}

	async findDatesWithCount(params: {
		from?: Date;
		to?: Date;
	}): Promise<{ date: string; count: number }[]> {
		const conditions = [];

		if (params.from) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, params.from));
		}

		if (params.to) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, params.to));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const results = await this.db
			.select({
				date: sql<string>`date(${contents.publishedAt})`,
				count: sql<number>`count(*)`,
			})
			.from(contents)
			.where(where || sql`1=1`)
			.groupBy(sql`date(${contents.publishedAt})`)
			.orderBy(asc(sql`date(${contents.publishedAt})`));

		return results;
	}

	async findCategoryStats(params: {
		from?: Date;
		to?: Date;
	}): Promise<{ name: string; count: number; latestUpdate: Date }[]> {
		const conditions = [];

		if (params.from) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, params.from));
		}

		if (params.to) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, params.to));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const results = await this.db
			.select({
				name: contents.category,
				count: sql<number>`count(*)`,
				latestUpdate: sql<Date>`max(${contents.publishedAt})`,
			})
			.from(contents)
			.where(where || sql`1=1`)
			.groupBy(contents.category)
			.orderBy(desc(sql`count(*)`));

		// Filter out null categories and convert to string type
		return results
			.filter((r) => r.name !== null)
			.map((r) => ({
				...r,
				name: r.name as string,
			}));
	}

	async findPopularTags(params: {
		from?: Date;
		to?: Date;
		limit?: number;
	}): Promise<{ name: string; count: number }[]> {
		const conditions = [];

		if (params.from) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, params.from));
		}

		if (params.to) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, params.to));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		// Use PostgreSQL's jsonb_array_elements_text to unpack jsonb tags array
		const results = await this.db
			.select({
				name: sql<string>`jsonb_array_elements_text(${contents.tags})`,
				count: sql<number>`count(*)`,
			})
			.from(contents)
			.where(where || sql`1=1`)
			.groupBy(sql`jsonb_array_elements_text(${contents.tags})`)
			.orderBy(desc(sql`count(*)`))
			.limit(params.limit || 50);

		return results;
	}

	async findSourceStats(params: {
		from?: Date;
		to?: Date;
	}): Promise<{ id: string; name: string; type: string; count: number }[]> {
		const conditions = [];

		if (params.from) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, params.from));
		}

		if (params.to) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, params.to));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		// Join with sources table to get source name and type
		const results = await this.db
			.select({
				id: sources.id,
				name: sources.name,
				type: sources.type,
				count: sql<number>`count(*)`,
			})
			.from(contents)
			.innerJoin(sources, eq(contents.sourceId, sources.id))
			.where(where || sql`1=1`)
			.groupBy(sources.id, sources.name, sources.type)
			.orderBy(desc(sql`count(*)`));

		return results;
	}
}

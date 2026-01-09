// apps/api/src/repositories/contents.repository.ts
import { contents } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { type SQL, and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

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
		sourceId?: string;
		publishedAfter?: Date;
		publishedBefore?: Date;
		limit: number;
		offset: number;
		orderBy?: { column: string; direction: "asc" | "desc" };
	}) {
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

		if (filters.sourceId) {
			conditions.push(eq(contents.sourceId, filters.sourceId));
		}

		if (filters.publishedAfter) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, filters.publishedAfter));
		}

		if (filters.publishedBefore) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, filters.publishedBefore));
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
		sourceId?: string;
		publishedAfter?: Date;
		publishedBefore?: Date;
	}): Promise<number> {
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

		if (filters.sourceId) {
			conditions.push(eq(contents.sourceId, filters.sourceId));
		}

		if (filters.publishedAfter) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(gte(contents.publishedAt, filters.publishedAfter));
		}

		if (filters.publishedBefore) {
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, filters.publishedBefore));
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
			// Include the entire end day
			const endOfDay = new Date(params.to);
			endOfDay.setHours(23, 59, 59, 999);
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, endOfDay));
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
			// Include the entire end day
			const endOfDay = new Date(params.to);
			endOfDay.setHours(23, 59, 59, 999);
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, endOfDay));
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
			// Include the entire end day
			const endOfDay = new Date(params.to);
			endOfDay.setHours(23, 59, 59, 999);
			// 直接使用 Date 对象，PostgreSQL 自动处理 UTC 时区
			conditions.push(lte(contents.publishedAt, endOfDay));
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
}

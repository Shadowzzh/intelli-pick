// apps/api/src/repositories/contents.repository.ts
import { contents } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { type SQL, and, asc, desc, eq, sql } from "drizzle-orm";

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
			conditions.push(sql`${contents.tags} && ${JSON.stringify(filters.tags)}`);
		}

		if (filters.sourceId) {
			conditions.push(eq(contents.sourceId, filters.sourceId));
		}

		if (filters.publishedAfter) {
			conditions.push(
				sql`${contents.publishedAt} >= ${filters.publishedAfter}`,
			);
		}

		if (filters.publishedBefore) {
			conditions.push(
				sql`${contents.publishedAt} <= ${filters.publishedBefore}`,
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
		sourceId?: string;
		publishedAfter?: Date;
		publishedBefore?: Date;
	}): Promise<number> {
		const conditions = [];

		if (filters.category) {
			conditions.push(eq(contents.category, filters.category));
		}

		if (filters.tags && filters.tags.length > 0) {
			conditions.push(sql`${contents.tags} && ${JSON.stringify(filters.tags)}`);
		}

		if (filters.sourceId) {
			conditions.push(eq(contents.sourceId, filters.sourceId));
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
			conditions.push(sql`${contents.publishedAt} >= ${params.from}`);
		}

		if (params.to) {
			// Include the entire end day
			const endOfDay = new Date(params.to);
			endOfDay.setHours(23, 59, 59, 999);
			conditions.push(sql`${contents.publishedAt} <= ${endOfDay}`);
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
			conditions.push(sql`${contents.publishedAt} >= ${params.from}`);
		}

		if (params.to) {
			// Include the entire end day
			const endOfDay = new Date(params.to);
			endOfDay.setHours(23, 59, 59, 999);
			conditions.push(sql`${contents.publishedAt} <= ${endOfDay}`);
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
			conditions.push(sql`${contents.publishedAt} >= ${params.from}`);
		}

		if (params.to) {
			// Include the entire end day
			const endOfDay = new Date(params.to);
			endOfDay.setHours(23, 59, 59, 999);
			conditions.push(sql`${contents.publishedAt} <= ${endOfDay}`);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		// Use PostgreSQL's jsonb_array_elements_text to unpack tags array
		const results = await this.db
			.select({
				name: sql<string>`unnest(${contents.tags})`,
				count: sql<number>`count(*)`,
			})
			.from(contents)
			.where(where || sql`1=1`)
			.groupBy(sql`unnest(${contents.tags})`)
			.orderBy(desc(sql`count(*)`))
			.limit(params.limit || 50);

		return results;
	}
}

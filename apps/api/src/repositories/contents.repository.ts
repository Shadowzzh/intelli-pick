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
}

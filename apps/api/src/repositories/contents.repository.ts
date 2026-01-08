// apps/api/src/repositories/contents.repository.ts
import { contents } from "@intellipick/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@intellipick/db";
import { BaseRepository } from "./base.repository.js";

export class ContentsRepository extends BaseRepository<typeof contents> {
	constructor(db: Database) {
		super(db, contents);
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
			conditions.push(
				sql`${contents.tags} && ${JSON.stringify(filters.tags)}`,
			);
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

		let orderBySql;
		if (filters.orderBy) {
			const column =
				contents[filters.orderBy.column as keyof typeof contents];
			orderBySql =
				filters.orderBy.direction === "asc"
					? asc(column as any)
					: desc(column as any);
		} else {
			orderBySql = desc(contents.publishedAt);
		}

		return this.findMany({
			where,
			limit: filters.limit,
			offset: filters.offset,
			orderBy: orderBySql,
		});
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
			conditions.push(
				sql`${contents.tags} && ${JSON.stringify(filters.tags)}`,
			);
		}

		if (filters.sourceId) {
			conditions.push(eq(contents.sourceId, filters.sourceId));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		return this.count(where);
	}
}

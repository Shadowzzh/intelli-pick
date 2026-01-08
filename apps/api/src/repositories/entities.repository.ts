// apps/api/src/repositories/entities.repository.ts
import { entities } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { desc, eq, sql } from "drizzle-orm";

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

	async findTrending(options: { limit: number; offset: number }) {
		return this.db
			.select()
			.from(entities)
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

	async count(): Promise<number> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(entities);
		return result.count;
	}
}

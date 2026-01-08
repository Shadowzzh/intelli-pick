// apps/api/src/repositories/entities.repository.ts
import { entities } from "@intellipick/db";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@intellipick/db";
import { BaseRepository } from "./base.repository.js";

export class EntitiesRepository extends BaseRepository<typeof entities> {
	constructor(db: Database) {
		super(db, entities);
	}

	async findByType(options: {
		type: string;
		limit: number;
		offset: number;
	}) {
		return this.findMany({
			where: eq(entities.type, options.type as any),
			limit: options.limit,
			offset: options.offset,
			orderBy: desc(entities.mentionCount),
		});
	}

	async findTrending(options: { limit: number; offset: number }) {
		return this.findMany({
			limit: options.limit,
			offset: options.offset,
			orderBy: desc(entities.mentionCount),
		});
	}

	async countByType(type: string): Promise<number> {
		return this.count(eq(entities.type, type as any));
	}
}

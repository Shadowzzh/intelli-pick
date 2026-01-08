// apps/api/src/repositories/entities.repository.ts
import { entityMentions } from "@intellipick/db";
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
}

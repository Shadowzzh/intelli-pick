// apps/api/src/repositories/sources.repository.ts
import { sources } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { and, asc, desc, eq } from "drizzle-orm";

export class SourcesRepository {
	constructor(private db: Database) {}

	async findById(id: string) {
		const [result] = await this.db
			.select()
			.from(sources)
			.where(eq(sources.id, id))
			.limit(1);
		return result;
	}

	async findAll() {
		return this.db
			.select()
			.from(sources)
			.where(eq(sources.isConfigured, true))
			.orderBy(desc(sources.enabled), asc(sources.name));
	}

	async updateEnabled(id: string, enabled: boolean) {
		const [result] = await this.db
			.update(sources)
			.set({ enabled, updatedAt: new Date() })
			.where(and(eq(sources.id, id), eq(sources.isConfigured, true)))
			.returning();
		return result;
	}
}

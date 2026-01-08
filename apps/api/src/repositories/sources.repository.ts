// apps/api/src/repositories/sources.repository.ts
import { sources } from "@intellipick/db";
import type { Database } from "@intellipick/db";
import { eq } from "drizzle-orm";

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
		return this.db.select().from(sources).orderBy(eq(sources.enabled, true));
	}
}

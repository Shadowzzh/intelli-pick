import type { Database } from "@intellipick/db";
// apps/api/src/repositories/base.repository.ts
import type { SQL, Table } from "drizzle-orm";
import { sql } from "drizzle-orm";

export abstract class BaseRepository {
	constructor(protected db: Database) {}

	async count(table: Table, where?: SQL): Promise<number> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(table)
			.where(where || sql`1=1`);
		return result.count;
	}
}

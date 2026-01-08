// apps/api/src/repositories/base.repository.ts
import type { AnyTable, SQL } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import type { Database } from "@intellipick/db";

export abstract class BaseRepository<T extends AnyTable> {
	constructor(
		protected db: Database,
		protected table: T,
	) {}

	async findById(id: string) {
		const [result] = await this.db
			.select()
			.from(this.table)
			.where(eq(this.table.id as any, id))
			.limit(1);
		return result;
	}

	async findMany(options: {
		where?: SQL;
		limit?: number;
		offset?: number;
		orderBy?: SQL;
	}) {
		let query = this.db.select().from(this.table);

		if (options.where) {
			query = query.where(options.where);
		}
		if (options.limit) {
			query = query.limit(options.limit);
		}
		if (options.offset) {
			query = query.offset(options.offset);
		}
		if (options.orderBy) {
			query = query.orderBy(options.orderBy);
		}

		return query;
	}

	async count(where?: SQL): Promise<number> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(this.table)
			.where(where || sql`1=1`);
		return result.count;
	}
}

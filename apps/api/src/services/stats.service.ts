import { db } from "@intellipick/db";
import { contents, entities, sources } from "@intellipick/db";
import { count, eq, sql } from "drizzle-orm";

export class StatsService {
	async getStats() {
		const totalContents = await db.select({ count: count() }).from(contents);
		const totalEntities = await db.select({ count: count() }).from(entities);
		const activeSources = await db
			.select({ count: count() })
			.from(sources)
			.where(eq(sources.enabled, true));

		const todayNew = await db
			.select({ count: count() })
			.from(contents)
			.where(
				sql`${contents.createdAt} >= (
					date_trunc('day', now() AT TIME ZONE 'Asia/Shanghai')
					AT TIME ZONE 'Asia/Shanghai'
				) AND ${contents.createdAt} < (
					(date_trunc('day', now() AT TIME ZONE 'Asia/Shanghai') + interval '1 day')
					AT TIME ZONE 'Asia/Shanghai'
				)`,
			);

		return {
			totalContents: totalContents[0].count,
			totalEntities: totalEntities[0].count,
			activeSources: activeSources[0].count,
			todayNew: todayNew[0].count,
		};
	}

	async getDatabaseHealth() {
		try {
			const rows = await db.execute<{ connectionCount: number }>(sql`
				SELECT count(*)::int AS "connectionCount"
				FROM pg_stat_activity
				WHERE datname = current_database()
			`);
			return {
				status: "connected" as const,
				connectionCount: rows[0]?.connectionCount ?? 0,
			};
		} catch {
			return { status: "disconnected" as const };
		}
	}
}

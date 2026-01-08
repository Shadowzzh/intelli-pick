import { db } from "@intellipick/db";
import { contents, entities, sources } from "@intellipick/db";
import dayjs from "dayjs";
import { and, count, eq, gte, lte } from "drizzle-orm";

export class StatsService {
	async getStats() {
		const totalContents = await db.select({ count: count() }).from(contents);
		const totalEntities = await db.select({ count: count() }).from(entities);
		const activeSources = await db
			.select({ count: count() })
			.from(sources)
			.where(eq(sources.enabled, true));

		const todayStart = dayjs().startOf("day").toDate();
		const todayEnd = dayjs().endOf("day").toDate();

		const todayNew = await db
			.select({ count: count() })
			.from(contents)
			.where(
				and(
					gte(contents.publishedAt, todayStart),
					lte(contents.publishedAt, todayEnd),
				),
			);

		return {
			totalContents: totalContents[0].count,
			totalEntities: totalEntities[0].count,
			activeSources: activeSources[0].count,
			todayNew: todayNew[0].count,
		};
	}
}

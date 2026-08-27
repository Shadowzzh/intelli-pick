import { contents, db } from "@intellipick/db";
import { and, count, gte, lt } from "drizzle-orm";

const SHANGHAI_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getShanghaiDayRange(now: Date): {
	start: Date;
	end: Date;
} {
	const shanghaiNow = new Date(now.getTime() + SHANGHAI_UTC_OFFSET_MS);
	const startTimestamp =
		Date.UTC(
			shanghaiNow.getUTCFullYear(),
			shanghaiNow.getUTCMonth(),
			shanghaiNow.getUTCDate(),
		) - SHANGHAI_UTC_OFFSET_MS;

	return {
		start: new Date(startTimestamp),
		end: new Date(startTimestamp + DAY_MS),
	};
}

export function createContentStatsQueries(now: Date = new Date()) {
	const { start, end } = getShanghaiDayRange(now);

	return {
		totalContents: db.select({ count: count() }).from(contents),
		todayNew: db
			.select({ count: count() })
			.from(contents)
			.where(and(gte(contents.createdAt, start), lt(contents.createdAt, end))),
	};
}

export async function getContentStats(
	now: Date = new Date(),
): Promise<{ totalContents: number; todayNew: number }> {
	const queries = createContentStatsQueries(now);
	const [[totalContents], [todayNew]] = await Promise.all([
		queries.totalContents,
		queries.todayNew,
	]);

	return {
		totalContents: totalContents?.count ?? 0,
		todayNew: todayNew?.count ?? 0,
	};
}

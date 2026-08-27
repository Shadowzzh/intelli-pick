import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	createContentStatsQueries,
	getShanghaiDayRange,
} from "./content-stats";

describe("content stats", () => {
	it("calculates the Shanghai calendar day in UTC", () => {
		const range = getShanghaiDayRange(new Date("2026-08-27T15:59:59.999Z"));

		assert.equal(range.start.toISOString(), "2026-08-26T16:00:00.000Z");
		assert.equal(range.end.toISOString(), "2026-08-27T16:00:00.000Z");
	});

	it("moves to the next Shanghai day at UTC 16:00", () => {
		const range = getShanghaiDayRange(new Date("2026-08-27T16:00:00.000Z"));

		assert.equal(range.start.toISOString(), "2026-08-27T16:00:00.000Z");
		assert.equal(range.end.toISOString(), "2026-08-28T16:00:00.000Z");
	});

	it("builds count-only queries with a created-at range", () => {
		const now = new Date("2026-08-27T15:59:59.999Z");
		const queries = createContentStatsQueries(now);
		const totalQuery = queries.totalContents.toSQL();
		const todayQuery = queries.todayNew.toSQL();

		assert.match(totalQuery.sql, /^select count\(\*\) from "contents"$/);
		assert.match(todayQuery.sql, /^select count\(\*\) from "contents" where /);
		assert.match(todayQuery.sql, /"contents"\."created_at" >= \$1/);
		assert.match(todayQuery.sql, /"contents"\."created_at" < \$2/);
		assert.deepEqual(todayQuery.params, [
			"2026-08-26T16:00:00.000Z",
			"2026-08-27T16:00:00.000Z",
		]);
		assert.ok(!todayQuery.sql.includes("source_id"));
		assert.ok(!todayQuery.sql.includes("published_at"));
	});
});

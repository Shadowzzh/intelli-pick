import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Config } from "@intellipick/config";
import type { AiClient } from "../lib/ai";
import { Pipeline } from "./index";

describe("content pipeline", () => {
	it("uses one AI extraction stage without AI filter", () => {
		const config = {
			sources: [],
			filter: {
				hardRules: {
					enabled: true,
					blacklistDomains: [],
					spamKeywords: [],
				},
			},
		} as unknown as Config;
		const pipeline = new Pipeline(config, {} as AiClient);

		assert.deepEqual(pipeline.getStepNames(), [
			"hard-filter",
			"dedup",
			"ai-extract",
			"storage",
		]);
		assert.ok(!pipeline.getStepNames().includes("ai-filter"));
	});
});

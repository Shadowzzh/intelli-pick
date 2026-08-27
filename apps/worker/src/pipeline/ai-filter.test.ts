import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FilterResult, RawContent } from "@intellipick/shared";
import {
	applyFilterDecisionRules,
	createLightweightFilterPrompt,
} from "./ai-filter";

const thresholds = {
	passMinValueScore: 50,
	rejectMaxValueScore: 29,
	quarantineOnSafety: true,
};

function createRaw(overrides: Partial<RawContent> = {}): RawContent {
	return {
		sourceType: "rss",
		sourceName: "LINUX DO 热门",
		sourceId: "source-id",
		externalId: "external-id",
		title: "DeepSeek 套餐与性能发生变化",
		content: "这段完整正文不应该发送给标题过滤模型。",
		url: "https://linux.do/t/topic/1",
		author: null,
		publishedAt: null,
		collectedAt: new Date().toISOString(),
		...overrides,
	};
}

function createResult(overrides: Partial<FilterResult> = {}): FilterResult {
	return {
		decision: "pass",
		valueScore: 60,
		noiseScore: 20,
		safety: { nsfwSexual: 0, harassment: 0, scam: 0 },
		reasons: ["HAS_EVIDENCE"],
		signals: ["hasNamedEntities"],
		oneLineWhy: "有明确产品变化",
		...overrides,
	};
}

describe("lightweight AI filter prompt", () => {
	it("uses title metadata without sending full content", () => {
		const raw = createRaw();
		const prompt = createLightweightFilterPrompt(raw);

		assert.ok(prompt.includes(raw.title || ""));
		assert.ok(prompt.includes("LINUX DO 热门"));
		assert.ok(prompt.includes("linux.do"));
		assert.ok(!prompt.includes(raw.content));
	});

	it("uses at most 300 normalized characters when title is missing", () => {
		const prompt = createLightweightFilterPrompt(
			createRaw({
				title: null,
				content: `${"有效内容 ".repeat(80)}不应出现的尾部标记`,
			}),
		);

		assert.ok(prompt.includes("无标题内容片段："));
		assert.ok(!prompt.includes("不应出现的尾部标记"));
	});
});

describe("lightweight AI filter decision rules", () => {
	it("keeps a consistent pass decision", () => {
		const result = applyFilterDecisionRules(
			createResult({ valueScore: 55 }),
			thresholds,
		);
		assert.equal(result.decision, "pass");
	});

	it("moves an uncertain score into quarantine", () => {
		const result = applyFilterDecisionRules(
			createResult({ valueScore: 45 }),
			thresholds,
		);
		assert.equal(result.decision, "quarantine");
	});

	it("rejects a pass decision with a very low score", () => {
		const result = applyFilterDecisionRules(
			createResult({ valueScore: 20 }),
			thresholds,
		);
		assert.equal(result.decision, "reject");
	});

	it("preserves a high-scoring rejection for review", () => {
		const result = applyFilterDecisionRules(
			createResult({ decision: "reject", valueScore: 52 }),
			thresholds,
		);
		assert.equal(result.decision, "quarantine");
	});

	it("quarantines explicit safety risks", () => {
		const result = applyFilterDecisionRules(
			createResult({ safety: { nsfwSexual: 0, harassment: 0, scam: 2 } }),
			thresholds,
		);
		assert.equal(result.decision, "quarantine");
	});
});

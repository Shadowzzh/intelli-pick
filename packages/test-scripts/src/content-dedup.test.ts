import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	type DedupContentInput,
	canonicalizeUrl,
	compareDuplicateCandidates,
	extractDedupKeyTokens,
	findDuplicateCandidatesForItem,
	normalizeDedupTitle,
} from "@intellipick/shared";

function createItem(
	overrides: Partial<DedupContentInput> = {},
): DedupContentInput {
	return {
		id: "content-1",
		sourceId: "source-1",
		sourceName: "Source One",
		externalId: "external-1",
		title: "DeepSeek V4 Pro 登陆 NVIDIA NIM",
		url: "https://example.com/article?id=1",
		publishedAt: "2026-08-27T00:00:00.000Z",
		collectedAt: "2026-08-27T00:10:00.000Z",
		...overrides,
	};
}

describe("content dedup normalization", () => {
	it("removes tracking parameters and URL fragments", () => {
		assert.equal(
			canonicalizeUrl(
				"https://www.example.com/news/?utm_source=rss&from=home&id=1#top",
			),
			"https://example.com/news?id=1",
		);
	});

	it("normalizes punctuation, Unicode width and boilerplate prefixes", () => {
		assert.equal(
			normalizeDedupTitle("【快讯】ＤｅｅｐＳｅｅｋ V4 Pro，登陆 NVIDIA NIM！"),
			"deepseekv4pro登陆nvidianim",
		);
	});

	it("extracts version and numeric guard tokens", () => {
		assert.deepEqual(extractDedupKeyTokens("GPT-5.4 上涨 20%"), [
			"20%",
			"5.4",
			"gpt5.4",
		]);
	});
});

describe("content dedup comparison", () => {
	it("matches the same external ID only inside one source", () => {
		const candidate = compareDuplicateCandidates(
			createItem(),
			createItem({ id: "content-2", url: "https://other.example/item" }),
		);
		assert.equal(candidate?.classification, "exact");
		assert.equal(candidate?.reason, "same_source_external_id");

		const crossSource = compareDuplicateCandidates(
			createItem(),
			createItem({
				id: "content-3",
				sourceId: "source-2",
				url: "https://other.example/item",
			}),
		);
		assert.notEqual(crossSource?.reason, "same_source_external_id");
	});

	it("matches canonical URLs with different tracking parameters", () => {
		const candidate = compareDuplicateCandidates(
			createItem({ url: "https://example.com/news?id=1&utm_source=rss" }),
			createItem({
				id: "content-2",
				sourceId: "source-2",
				externalId: "external-2",
				url: "https://www.example.com/news/?from=feed&id=1#comments",
			}),
		);
		assert.equal(candidate?.classification, "exact");
		assert.equal(candidate?.reason, "canonical_url");
	});

	it("matches lightly edited titles across sources", () => {
		const candidate = compareDuplicateCandidates(
			createItem(),
			createItem({
				id: "content-2",
				sourceId: "source-2",
				externalId: "external-2",
				title: "快讯：DeepSeek V4 Pro 正式登陆 NVIDIA NIM！",
				url: "https://other.example/news",
			}),
		);
		assert.ok(candidate);
		assert.notEqual(candidate.classification, "exact");
	});

	it("does not auto-merge different model versions", () => {
		const candidate = compareDuplicateCandidates(
			createItem({ title: "GPT-5.3 正式发布" }),
			createItem({
				id: "content-2",
				sourceId: "source-2",
				externalId: "external-2",
				title: "GPT-5.4 正式发布",
				url: "https://other.example/gpt",
			}),
		);
		assert.notEqual(candidate?.classification, "automatic");
	});

	it("keeps recurring identical titles from one source for review", () => {
		const candidate = compareDuplicateCandidates(
			createItem({ title: "每日 AI 早报", externalId: "day-1" }),
			createItem({
				id: "content-2",
				externalId: "day-2",
				title: "每日 AI 早报",
				url: "https://example.com/day-2",
			}),
		);
		assert.equal(candidate?.classification, "review");
	});

	it("does not auto-merge daily market updates from one source", () => {
		const candidate = compareDuplicateCandidates(
			createItem({
				externalId: "day-1",
				title: "美国比特币及以太坊现货ETF净流入",
			}),
			createItem({
				id: "content-2",
				externalId: "day-2",
				title: "美国比特币与以太坊现货ETF净流入",
				url: "https://example.com/day-2",
				publishedAt: "2026-08-28T00:00:00.000Z",
			}),
		);
		assert.notEqual(candidate?.classification, "automatic");
	});

	it("ignores unrelated titles", () => {
		const candidate = compareDuplicateCandidates(
			createItem(),
			createItem({
				id: "content-2",
				sourceId: "source-2",
				externalId: "external-2",
				title: "香港线下消费可以使用哪些支付方式",
				url: "https://other.example/payment",
			}),
		);
		assert.equal(candidate, null);
	});

	it("compares one new item against recent content", () => {
		const candidates = findDuplicateCandidatesForItem(createItem(), [
			createItem({
				id: "content-2",
				sourceId: "source-2",
				externalId: "external-2",
				title: "DeepSeek V4 Pro 正式登陆 NVIDIA NIM",
				url: "https://other.example/deepseek",
			}),
			createItem({
				id: "content-3",
				sourceId: "source-3",
				externalId: "external-3",
				title: "香港线下消费可以使用哪些支付方式",
				url: "https://other.example/payment",
			}),
		]);
		assert.equal(candidates.length, 1);
		assert.equal(candidates[0].right.id, "content-2");
	});
});

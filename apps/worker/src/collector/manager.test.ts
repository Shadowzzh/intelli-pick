import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SourceConfig } from "@intellipick/config";
import type { RawContent } from "@intellipick/shared";
import { CollectorManager } from "./manager";
import type { CollectorPlugin } from "./types";

function createSource(overrides: Partial<SourceConfig> = {}): SourceConfig {
	return {
		name: "测试数据源",
		type: "rss",
		enabled: true,
		fetchInterval: 3600,
		config: { url: "https://example.com/feed.xml" },
		...overrides,
	} as SourceConfig;
}

function createContent(): RawContent {
	return {
		sourceType: "rss",
		sourceName: "测试数据源",
		sourceId: "source-id",
		externalId: "content-id",
		title: "测试内容",
		content: "正文",
		url: "https://example.com/content-id",
		author: null,
		publishedAt: null,
		collectedAt: new Date().toISOString(),
	};
}

describe("CollectorManager", () => {
	it("returns collected items from a registered plugin", async () => {
		const manager = new CollectorManager(
			new Map([["测试数据源", "source-id"]]),
		);
		const expected = [createContent()];
		const plugin: CollectorPlugin = {
			type: "rss",
			collect: async (_source, sourceId) => {
				assert.equal(sourceId, "source-id");
				return expected;
			},
		};
		manager.register(plugin);

		const result = await manager.collectSource(createSource());

		assert.deepEqual(result, expected);
	});

	it("propagates plugin failures to the scheduler", async () => {
		const manager = new CollectorManager(
			new Map([["测试数据源", "source-id"]]),
		);
		const pluginError = new Error("upstream request failed");
		manager.register({
			type: "rss",
			collect: async () => {
				throw pluginError;
			},
		});

		await assert.rejects(manager.collectSource(createSource()), pluginError);
	});

	it("rejects sources without a registered plugin", async () => {
		const manager = new CollectorManager(
			new Map([["测试数据源", "source-id"]]),
		);

		await assert.rejects(
			manager.collectSource(createSource({ type: "v2ex" })),
			/No collector plugin registered for source type v2ex/,
		);
	});

	it("rejects sources that were not synchronized", async () => {
		const manager = new CollectorManager(new Map());
		manager.register({ type: "rss", collect: async () => [] });

		await assert.rejects(
			manager.collectSource(createSource()),
			/Source 测试数据源 was not synchronized to the database/,
		);
	});
});

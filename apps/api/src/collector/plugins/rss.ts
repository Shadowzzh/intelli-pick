import type { RawContent } from "@ai-filter/shared";
// apps/api/src/collector/plugins/rss.ts
import Parser from "rss-parser";
import type { RssConfig, SourceConfig } from "../../lib/config.js";
import type { CollectorPlugin } from "../types.js";

const parser = new Parser();

export const rssPlugin: CollectorPlugin = {
	type: "rss",

	async collect(source: SourceConfig): Promise<RawContent[]> {
		const config = source.config as RssConfig;
		const feed = await parser.parseURL(config.url);

		return (feed.items || []).map((item) => ({
			sourceType: "rss",
			sourceId: source.name,
			externalId: item.guid || item.link || "",
			title: item.title || null,
			content: item.contentSnippet || item.content || "",
			url: item.link || "",
			author: item.creator || item.author || null,
			publishedAt: item.pubDate ? new Date(item.pubDate) : null,
			collectedAt: new Date(),
			raw: item,
		}));
	},
};

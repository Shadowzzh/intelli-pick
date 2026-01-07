import type { RssConfig, SourceConfig } from "@intellipick/config";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/collector/plugins/rss.ts
import Parser from "rss-parser";
import type { CollectorPlugin } from "../types";
import { getNodeProxyAgent } from "../../lib/proxy";

const parser = new Parser({
	requestOptions: {
		agent: getNodeProxyAgent(),
	},
});

export const rssPlugin: CollectorPlugin = {
	type: "rss",

	async collect(source: SourceConfig, sourceId: string): Promise<RawContent[]> {
		const config = source.config as RssConfig;
		const feed = await parser.parseURL(config.url);

		return (feed.items || []).map((item) => ({
			sourceType: "rss",
			sourceId: sourceId, // 使用数据库中的 source ID
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

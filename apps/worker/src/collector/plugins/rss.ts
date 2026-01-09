import type { RssConfig, SourceConfig } from "@intellipick/config";
import { toUTCISOString } from "@intellipick/shared";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/collector/plugins/rss.ts
import Parser from "rss-parser";
import { getNodeProxyAgent } from "../../lib/proxy";
import type { CollectorPlugin } from "../types";

export const rssPlugin: CollectorPlugin = {
	type: "rss",

	async collect(source: SourceConfig, sourceId: string): Promise<RawContent[]> {
		const config = source.config as RssConfig;

		// 创建带代理的 parser 实例
		const httpAgent = getNodeProxyAgent();
		const parser = new Parser(
			httpAgent
				? {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
						},
						requestOptions: {
							agent: httpAgent,
							timeout: 10000, // 10秒超时
						},
					}
				: {
						timeout: 10000, // 10秒超时（无代理情况）
					},
		);

		const feed = await parser.parseURL(config.url);

		return (feed.items || []).map((item) => ({
			sourceType: "rss",
			sourceId: sourceId, // 使用数据库中的 source ID
			externalId: item.guid || item.link || "",
			title: item.title || null,
			content: item.contentSnippet || item.content || "",
			url: item.link || "",
			author: item.creator || item.author || null,
			publishedAt: item.pubDate ? toUTCISOString(item.pubDate) : null,
			collectedAt: toUTCISOString(new Date()),
			raw: item,
		}));
	},
};

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RssConfig, SourceConfig } from "@intellipick/config";
import { toUTCISOString } from "@intellipick/shared";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/collector/plugins/rss.ts
import Parser from "rss-parser";
import { getNodeProxyAgent } from "../../lib/proxy";
import type { CollectorPlugin } from "../types";

const execFileAsync = promisify(execFile);

async function parseFeed(parser: Parser, config: RssConfig) {
	if (config.fetchMethod !== "curl") {
		return parser.parseURL(config.url);
	}

	const { stdout } = await execFileAsync(
		"curl",
		["-fsSL", "--connect-timeout", "5", "--max-time", "12", config.url],
		{
			encoding: "utf8",
			timeout: 14000,
			maxBuffer: 16 * 1024 * 1024,
		},
	);

	return parser.parseString(stdout);
}

export const rssPlugin: CollectorPlugin = {
	type: "rss",

	async collect(source: SourceConfig, sourceId: string): Promise<RawContent[]> {
		const config = source.config as RssConfig;

		// 容器内 RSSHub 走内部网络，外部 RSS 才使用代理。
		const httpAgent = config.useProxy ? getNodeProxyAgent() : undefined;
		const parser = new Parser(
			httpAgent
				? {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
						},
						requestOptions: {
							agent: httpAgent,
							timeout: 30000, // 30 秒超时
						},
						timeout: 30000,
					}
				: {
						timeout: 30000, // 30 秒超时
					},
		);

		const feed = await parseFeed(parser, config);

		return (feed.items || []).map((item) => ({
			sourceType: "rss",
			sourceName: source.name,
			sourceId: sourceId, // 使用数据库中的 source ID
			externalId: item.guid || item.link || "",
			title: item.title || null,
			content: item.contentSnippet || item.content || "",
			url: item.link || "",
			author: item.creator || item.author || null,
			// 如果 RSS 源没有提供 pubDate，使用当前时间作为 publishedAt
			publishedAt: item.pubDate
				? toUTCISOString(item.pubDate)
				: toUTCISOString(new Date()),
			collectedAt: toUTCISOString(new Date()),
			raw: item,
		}));
	},
};

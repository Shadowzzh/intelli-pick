import type { SourceConfig, V2exConfig } from "@intellipick/config";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/collector/plugins/v2ex.ts
import { fetch } from "undici";
import { getProxyAgent } from "../../lib/proxy";
import type { CollectorPlugin } from "../types";

interface V2exTopic {
	id: number;
	title: string;
	content: string;
	content_rendered: string;
	url: string;
	member: { username: string };
	created: number;
}

export const v2exPlugin: CollectorPlugin = {
	type: "v2ex",

	async collect(source: SourceConfig, sourceId: string): Promise<RawContent[]> {
		const config = source.config as V2exConfig;
		const apiUrl =
			config.node === "hot"
				? "https://www.v2ex.com/api/topics/hot.json"
				: `https://www.v2ex.com/api/topics/show.json?node_name=${config.node}`;

		const dispatcher = getProxyAgent();
		const response = await fetch(apiUrl, { dispatcher });
		const topics = (await response.json()) as V2exTopic[];

		return topics.map((topic) => ({
			sourceType: "v2ex",
			sourceId: sourceId, // 使用数据库中的 source ID
			externalId: String(topic.id),
			title: topic.title,
			content: topic.content || topic.content_rendered || "",
			url: topic.url || `https://www.v2ex.com/t/${topic.id}`,
			author: topic.member?.username || null,
			publishedAt: topic.created ? new Date(topic.created * 1000) : null,
			collectedAt: new Date(),
			raw: topic,
		}));
	},
};

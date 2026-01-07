import type { SourceConfig, TwitterConfig } from "@intellipick/config";
import { env } from "@intellipick/env";
import type { RawContent } from "@intellipick/shared";
// apps/api/src/collector/plugins/twitter.ts
import { TwitterApi } from "twitter-api-v2";
import { getNodeProxyAgent } from "../../lib/proxy";
import { createLogger } from "../../lib/logger";
import type { CollectorPlugin } from "../types";

const logger = createLogger("twitter-plugin");

export const twitterPlugin: CollectorPlugin = {
	type: "twitter",

	async collect(source: SourceConfig, sourceId: string): Promise<RawContent[]> {
		const config = source.config as TwitterConfig;

		// 检查 Twitter 凭据是否配置
		if (
			!env.TWITTER_CLIENT_ID ||
			!env.TWITTER_CLIENT_SECRET ||
			!env.TWITTER_ACCESS_TOKEN ||
			!env.TWITTER_REFRESH_TOKEN
		) {
			logger.warn("Twitter credentials not configured, skipping");
			return [];
		}

		// 获取代理 agent
		const httpAgent = getNodeProxyAgent();

		const client = new TwitterApi(
			{
				appKey: env.TWITTER_CLIENT_ID,
				appSecret: env.TWITTER_CLIENT_SECRET,
				accessToken: env.TWITTER_ACCESS_TOKEN,
				accessSecret: env.TWITTER_REFRESH_TOKEN,
			},
			{
				httpAgent, // 使用代理 agent
			},
		);

		if (httpAgent) {
			logger.info("Twitter client configured with proxy");
		} else {
			logger.debug("Twitter client without proxy");
		}

		const results: RawContent[] = [];

		try {
			if (config.mode === "home") {
				// Home Timeline
				const timeline = await client.v2.homeTimeline({
					max_results: config.maxResults,
					"tweet.fields": ["created_at", "author_id", "text"],
					expansions: ["author_id"],
				});

				for (const tweet of timeline.data.data || []) {
					results.push({
						sourceType: "twitter",
						sourceId: sourceId, // 使用数据库中的 source ID
						externalId: tweet.id,
						title: null,
						content: tweet.text,
						url: `https://twitter.com/i/web/status/${tweet.id}`,
						author: tweet.author_id || null,
						publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
						collectedAt: new Date(),
						raw: tweet,
					});
				}
			} else if (config.mode === "user" && config.usernames) {
				// User Timeline
				for (const username of config.usernames) {
					try {
						const user = await client.v2.userByUsername(username);
						if (!user.data) continue;

						const tweets = await client.v2.userTimeline(user.data.id, {
							max_results: config.maxResults,
							"tweet.fields": ["created_at", "text"],
						});

						for (const tweet of tweets.data.data || []) {
							results.push({
								sourceType: "twitter",
								sourceId: sourceId, // 使用数据库中的 source ID
								externalId: tweet.id,
								title: null,
								content: tweet.text,
								url: `https://twitter.com/${username}/status/${tweet.id}`,
								author: username,
								publishedAt: tweet.created_at
									? new Date(tweet.created_at)
									: null,
								collectedAt: new Date(),
								raw: tweet,
							});
						}
					} catch (err) {
						logger.error({ err, username }, "Failed to fetch user timeline");
					}
				}
			} else if (config.mode === "list" && config.listId) {
				// List Timeline
				const listTweets = await client.v2.listTweets(config.listId, {
					max_results: config.maxResults,
					"tweet.fields": ["created_at", "author_id", "text"],
				});

				for (const tweet of listTweets.data.data || []) {
					results.push({
						sourceType: "twitter",
						sourceId: sourceId, // 使用数据库中的 source ID
						externalId: tweet.id,
						title: null,
						content: tweet.text,
						url: `https://twitter.com/i/web/status/${tweet.id}`,
						author: tweet.author_id || null,
						publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
						collectedAt: new Date(),
						raw: tweet,
					});
				}
			}
		} catch (err) {
			logger.error({ err, mode: config.mode }, "Failed to fetch tweets");
		}

		return results;
	},
};

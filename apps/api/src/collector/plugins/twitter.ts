import type { RawContent } from "@ai-filter/shared";
// apps/api/src/collector/plugins/twitter.ts
import { TwitterApi } from "twitter-api-v2";
import type { SourceConfig, TwitterConfig } from "../../lib/config.js";
import { createLogger } from "../../lib/logger.js";
import type { CollectorPlugin } from "../types.js";

const logger = createLogger("twitter-plugin");

export const twitterPlugin: CollectorPlugin = {
	type: "twitter",

	async collect(source: SourceConfig): Promise<RawContent[]> {
		const config = source.config as TwitterConfig;

		const client = new TwitterApi({
			appKey: config.clientId,
			appSecret: config.clientSecret,
			accessToken: config.accessToken,
			accessSecret: config.refreshToken, // OAuth 1.0a 使用
		});

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
						sourceId: source.name,
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
								sourceId: source.name,
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
						sourceId: source.name,
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

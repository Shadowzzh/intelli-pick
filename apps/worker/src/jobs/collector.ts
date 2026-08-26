import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { JobSourceConfig } from "@intellipick/config";
import { toUTCISOString } from "@intellipick/shared";
import { load } from "cheerio";
import Parser from "rss-parser";
import { fetch } from "undici";
import { getNodeProxyAgent, getProxyAgent } from "../lib/proxy";
import type { RawJobPosting } from "./types";

const execFileAsync = promisify(execFile);

interface JsonFeedAuthor {
	name?: string;
}

interface JsonFeedItem {
	id?: string;
	url?: string;
	title?: string;
	content_html?: string;
	content_text?: string;
	date_published?: string;
	author?: JsonFeedAuthor;
}

interface JsonFeed {
	items?: JsonFeedItem[];
}

function htmlToText(value: string): string {
	const $ = load(value);
	$("br").replaceWith("\n");
	$("p, li, div").append("\n");
	return $.root()
		.text()
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function normalizeExternalId(id: string | undefined, url: string): string {
	const topicMatch = url.match(/\/t\/(\d+)/);
	if (topicMatch?.[1]) {
		return topicMatch[1];
	}

	return id || url;
}

async function collectJsonFeed(
	source: JobSourceConfig,
	sourceId: string,
): Promise<RawJobPosting[]> {
	const response = await fetch(source.url, {
		dispatcher: getProxyAgent(),
		signal: AbortSignal.timeout(30000),
		headers: {
			"User-Agent": "Sift Jobs/1.0",
		},
	});

	if (!response.ok) {
		throw new Error(`Job feed request failed with status ${response.status}`);
	}

	const feed = (await response.json()) as JsonFeed;
	const collectedAt = toUTCISOString(new Date());

	return (feed.items || [])
		.filter((item) => Boolean(item.url && item.title))
		.map((item) => {
			const url = item.url as string;
			const htmlContent = item.content_html || "";
			const content = item.content_text || htmlToText(htmlContent);

			return {
				sourceId,
				sourceKey: source.key,
				externalId: normalizeExternalId(item.id, url),
				url,
				title: item.title as string,
				author: item.author?.name || null,
				content,
				publishedAt: item.date_published || null,
				collectedAt,
				rawData: item as unknown as Record<string, unknown>,
			};
		});
}

async function collectRssFeed(
	source: JobSourceConfig,
	sourceId: string,
): Promise<RawJobPosting[]> {
	const httpAgent = getNodeProxyAgent();
	const parser = new Parser({
		headers: { "User-Agent": "Sift Jobs/1.0" },
		requestOptions: httpAgent ? { agent: httpAgent } : undefined,
		timeout: 30000,
	});
	const feed = await parser.parseURL(source.url);
	const collectedAt = toUTCISOString(new Date());

	return (feed.items || [])
		.filter((item) => Boolean(item.link && item.title))
		.map((item) => {
			const url = item.link as string;
			return {
				sourceId,
				sourceKey: source.key,
				externalId: normalizeExternalId(item.guid, url),
				url,
				title: item.title as string,
				author: item.creator || item.author || null,
				content: item.contentSnippet || item.content || "",
				publishedAt: item.pubDate ? toUTCISOString(item.pubDate) : null,
				collectedAt,
				rawData: item as unknown as Record<string, unknown>,
			};
		});
}

async function collectCurlRssFeed(
	source: JobSourceConfig,
	sourceId: string,
): Promise<RawJobPosting[]> {
	const { stdout } = await execFileAsync(
		"curl",
		["-fsSL", "--connect-timeout", "10", "--max-time", "30", source.url],
		{
			encoding: "utf8",
			timeout: 35000,
			maxBuffer: 16 * 1024 * 1024,
		},
	);
	const parser = new Parser();
	const feed = await parser.parseString(stdout);
	const collectedAt = toUTCISOString(new Date());

	return (feed.items || [])
		.filter((item) => Boolean(item.link && item.title))
		.map((item) => {
			const url = item.link as string;
			return {
				sourceId,
				sourceKey: source.key,
				externalId: normalizeExternalId(item.guid, url),
				url,
				title: item.title as string,
				author: item.creator || item.author || null,
				content: item.contentSnippet || item.content || "",
				publishedAt: item.pubDate ? toUTCISOString(item.pubDate) : null,
				collectedAt,
				rawData: item as unknown as Record<string, unknown>,
			};
		});
}

export async function collectJobSource(
	source: JobSourceConfig,
	sourceId: string,
): Promise<RawJobPosting[]> {
	if (source.type === "json-feed") {
		return collectJsonFeed(source, sourceId);
	}
	if (source.type === "curl-rss") {
		return collectCurlRssFeed(source, sourceId);
	}

	return collectRssFeed(source, sourceId);
}

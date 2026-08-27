// apps/api/src/lib/dedup.ts
import { contents, db } from "@intellipick/db";
import type { RawContent } from "@intellipick/shared";
import { type SQL, and, eq, inArray, or } from "drizzle-orm";
import { createLogger } from "./logger";

const logger = createLogger("dedup");

/**
 * 批量检查哪些内容已存在于数据库
 * @param items 待检查的原始内容列表
 * @returns 过滤后的新内容列表
 */
export async function filterExistingContent(
	items: RawContent[],
): Promise<RawContent[]> {
	if (items.length === 0) return [];

	const urls = items.map((item) => item.url);
	const externalIdsBySource = new Map<string, string[]>();
	for (const item of items) {
		const ids = externalIdsBySource.get(item.sourceId) || [];
		ids.push(item.externalId);
		externalIdsBySource.set(item.sourceId, ids);
	}
	const contentIdentityConditions: SQL[] = [];
	for (const [sourceId, externalIds] of externalIdsBySource) {
		contentIdentityConditions.push(
			and(
				eq(contents.sourceId, sourceId),
				inArray(contents.externalId, externalIds),
			) as SQL,
		);
	}

	const existing = await db
		.select({
			sourceId: contents.sourceId,
			url: contents.url,
			externalId: contents.externalId,
		})
		.from(contents)
		.where(or(inArray(contents.url, urls), ...contentIdentityConditions));
	const existingUrls = new Set(existing.map((item) => item.url));
	const existingIdentities = new Set(
		existing.map((item) => `${item.sourceId}\0${item.externalId}`),
	);

	const newItems = items.filter(
		(item) =>
			!existingUrls.has(item.url) &&
			!existingIdentities.has(`${item.sourceId}\0${item.externalId}`),
	);

	logger.info(
		{
			total: items.length,
			existing: items.length - newItems.length,
			new: newItems.length,
		},
		"Dedup check completed",
	);

	return newItems;
}

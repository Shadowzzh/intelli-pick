// apps/api/src/lib/dedup.ts
import { contents, db } from "@intellipick/db";
import type { RawContent } from "@intellipick/shared";
import { inArray, or } from "drizzle-orm";
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

	// 提取所有 URL 和 externalId
	const urls = items.map((item) => item.url);
	const externalIds = items.map((item) => item.externalId);

	// 单次查询检查所有内容
	const existing = await db.query.contents.findMany({
		where: or(
			inArray(contents.url, urls),
			inArray(contents.externalId, externalIds),
		),
		columns: {
			url: true,
			externalId: true,
		},
	});

	// 构建已存在内容的 Set（用于快速查找）
	const existingUrls = new Set(existing.map((e) => e.url));
	const existingIds = new Set(existing.map((e) => e.externalId));

	// 过滤出新内容
	const newItems = items.filter(
		(item) => !existingUrls.has(item.url) && !existingIds.has(item.externalId),
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

// apps/api/src/lib/sources.ts
import type { Config } from "@intellipick/config";
import { db, sources } from "@intellipick/db";
import { eq } from "drizzle-orm";
import { createLogger } from "./logger";

const logger = createLogger("sources");

/**
 * 同步配置中的 sources 到数据库
 * 如果 source 已存在（通过 name+type 匹配），则更新
 * 如果不存在，则创建新记录
 * 返回一个 Map，key 是 source name，value 是数据库中的 source ID
 */
export async function syncSources(
	config: Config,
): Promise<Map<string, string>> {
	const sourceMap = new Map<string, string>();

	for (const sourceConfig of config.sources) {
		// 查找是否已存在
		const existing = await db.query.sources.findFirst({
			where: eq(sources.name, sourceConfig.name),
		});

		if (existing) {
			// 更新现有记录
			await db
				.update(sources)
				.set({
					type: sourceConfig.type,
					config: sourceConfig.config,
					enabled: sourceConfig.enabled,
					fetchInterval: sourceConfig.fetchInterval,
					updatedAt: new Date(),
				})
				.where(eq(sources.id, existing.id));

			sourceMap.set(sourceConfig.name, existing.id);
			logger.info(
				{ name: sourceConfig.name, id: existing.id },
				"Updated source",
			);
		} else {
			// 创建新记录
			const [newSource] = await db
				.insert(sources)
				.values({
					name: sourceConfig.name,
					type: sourceConfig.type,
					config: sourceConfig.config,
					enabled: sourceConfig.enabled,
					fetchInterval: sourceConfig.fetchInterval,
				})
				.returning();

			sourceMap.set(sourceConfig.name, newSource.id);
			logger.info(
				{ name: sourceConfig.name, id: newSource.id },
				"Created source",
			);
		}
	}

	return sourceMap;
}

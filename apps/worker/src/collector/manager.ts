import type { SourceConfig } from "@intellipick/config";
// apps/api/src/collector/manager.ts
import type { RawContent } from "@intellipick/shared";
import { createLogger } from "../lib/logger";
import type { CollectorPlugin } from "./types";

const logger = createLogger("collector-manager");

export class CollectorManager {
	private plugins = new Map<string, CollectorPlugin>();

	constructor(private sourceMap: Map<string, string>) {}

	register(plugin: CollectorPlugin): void {
		this.plugins.set(plugin.type, plugin);
		logger.info({ type: plugin.type }, "Registered collector plugin");
	}

	async collectSource(source: SourceConfig): Promise<RawContent[]> {
		const plugin = this.plugins.get(source.type);
		if (!plugin) {
			logger.warn({ type: source.type }, "No plugin found for source type");
			return [];
		}

		// 获取数据库中的 source ID
		const sourceId = this.sourceMap.get(source.name);
		if (!sourceId) {
			logger.error(
				{ name: source.name },
				"Source not found in database, skipping",
			);
			return [];
		}

		try {
			logger.info(
				{ name: source.name, type: source.type },
				"Collecting from source",
			);
			const results = await plugin.collect(source, sourceId);
			logger.info(
				{ name: source.name, count: results.length },
				"Collected items",
			);
			return results;
		} catch (err) {
			logger.error({ err, name: source.name }, "Failed to collect from source");
			return [];
		}
	}

	async collectAll(sources: SourceConfig[]): Promise<RawContent[]> {
		const enabledSources = sources.filter((s) => s.enabled);
		const results: RawContent[] = [];

		for (const source of enabledSources) {
			const items = await this.collectSource(source);
			results.push(...items);
		}

		return results;
	}
}

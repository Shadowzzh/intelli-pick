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
			const error = new Error(
				`No collector plugin registered for source type ${source.type}`,
			);
			logger.error({ type: source.type, err: error }, error.message);
			throw error;
		}

		// 获取数据库中的 source ID
		const sourceId = this.sourceMap.get(source.name);
		if (!sourceId) {
			const error = new Error(
				`Source ${source.name} was not synchronized to the database`,
			);
			logger.error({ name: source.name, err: error }, error.message);
			throw error;
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
			throw err;
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

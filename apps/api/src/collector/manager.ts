import type { SourceConfig } from "@ai-filter/config";
// apps/api/src/collector/manager.ts
import type { RawContent } from "@ai-filter/shared";
import { createLogger } from "../lib/logger.js";
import type { CollectorPlugin } from "./types.js";

const logger = createLogger("collector-manager");

export class CollectorManager {
	private plugins = new Map<string, CollectorPlugin>();

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

		try {
			logger.info(
				{ name: source.name, type: source.type },
				"Collecting from source",
			);
			const results = await plugin.collect(source);
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

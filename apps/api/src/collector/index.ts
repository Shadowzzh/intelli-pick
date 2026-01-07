// apps/api/src/collector/index.ts
import { CollectorManager } from "./manager";
import { rssPlugin, twitterPlugin, v2exPlugin } from "./plugins";

export function createCollectorManager(
	sourceMap: Map<string, string>,
): CollectorManager {
	const manager = new CollectorManager(sourceMap);

	manager.register(rssPlugin);
	manager.register(v2exPlugin);
	manager.register(twitterPlugin);

	return manager;
}

export { CollectorManager } from "./manager";
export type { CollectorPlugin } from "./types";

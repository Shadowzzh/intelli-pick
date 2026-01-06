// apps/api/src/collector/index.ts
import { CollectorManager } from "./manager.js";
import { rssPlugin, v2exPlugin, twitterPlugin } from "./plugins/index.js";

export function createCollectorManager(): CollectorManager {
  const manager = new CollectorManager();

  manager.register(rssPlugin);
  manager.register(v2exPlugin);
  manager.register(twitterPlugin);

  return manager;
}

export { CollectorManager } from "./manager.js";
export type { CollectorPlugin } from "./types.js";

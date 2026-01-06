// packages/config/src/index.ts
import { resolve } from "node:path";
import { createJiti } from "jiti";
import { ConfigSchema } from "./schema.js";
import type { Config } from "./schema.js";

export function defineConfig<T extends Config>(config: T): T {
	return config;
}

export async function loadConfig(path = "config.ts"): Promise<Config> {
	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(resolve(process.cwd(), path));
	const raw = (mod as { default: unknown }).default;
	return ConfigSchema.parse(raw);
}

export type {
	Config,
	SourceConfig,
	TwitterConfig,
	RssConfig,
	V2exConfig,
	AiConfig,
} from "./schema.js";

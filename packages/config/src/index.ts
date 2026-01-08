// packages/config/src/index.ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { ConfigSchema } from "./schema.js";
import type { Config } from "./schema.js";

export function defineConfig(config: Config): Config {
	// 自动从环境变量读取 HTTP_PROXY
	const mergedConfig = {
		...config,
		network: {
			...config.network,
			httpProxy: process.env.HTTP_PROXY || config.network?.httpProxy,
		},
	};
	return ConfigSchema.parse(mergedConfig);
}

export async function loadConfig(path = "config.ts"): Promise<Config> {
	const jiti = createJiti(process.cwd());
	const fullPath = resolve(process.cwd(), path);
	const mod = await jiti.import(fullPath);
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
	ApiConfig,
} from "./schema";

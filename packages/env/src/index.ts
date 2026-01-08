import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// packages/env/src/index.ts
import { config } from "dotenv";

// 向上查找 .env 文件直到找到或到达根目录
function findEnvFile(startDir: string): string | null {
	let currentDir = startDir;
	while (true) {
		const envPath = resolve(currentDir, ".env");
		if (existsSync(envPath)) {
			return envPath;
		}
		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) {
			// 已到达根目录
			return null;
		}
		currentDir = parentDir;
	}
}

// 从当前工作目录开始向上查找 .env 文件
const envPath = findEnvFile(process.cwd());
if (envPath) {
	config({ path: envPath });
}

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// 环境
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		// 日志配置
		LOG_LEVEL: z
			.enum(["trace", "debug", "info", "warn", "error", "fatal"])
			.default("info"),
		LOG_PRETTY: z
			.enum(["true", "false"])
			.transform((val) => val === "true")
			.default("true"),

		// 数据库
		DATABASE_URL: z
			.string()
			.url()
			.default("postgresql://localhost:5432/ai_filter"),

		// Redis
		REDIS_URL: z.string().url().default("redis://localhost:6379"),

		// AI Providers
		DEEPSEEK_API_KEY: z.string().min(1).optional(),
		DEEPSEEK_BASE_URL: z.string().url().optional(),
		ANTHROPIC_API_KEY: z.string().min(1).optional(),
		ANTHROPIC_BASE_URL: z.string().url().optional(),

		// Twitter（可选）
		TWITTER_CLIENT_ID: z.string().optional(),
		TWITTER_CLIENT_SECRET: z.string().optional(),
		TWITTER_ACCESS_TOKEN: z.string().optional(),
		TWITTER_REFRESH_TOKEN: z.string().optional(),
	},
	runtimeEnv: process.env,
});

export type Env = typeof env;

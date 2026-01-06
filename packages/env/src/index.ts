// packages/env/src/index.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// 数据库
		DATABASE_URL: z
			.string()
			.url()
			.default("postgresql://localhost:5432/ai_filter"),

		// Redis
		REDIS_URL: z.string().url().default("redis://localhost:6379"),

		// AI Providers
		DEEPSEEK_API_KEY: z.string().min(1).optional(),
		ANTHROPIC_API_KEY: z.string().min(1).optional(),

		// Twitter（可选）
		TWITTER_CLIENT_ID: z.string().optional(),
		TWITTER_CLIENT_SECRET: z.string().optional(),
		TWITTER_ACCESS_TOKEN: z.string().optional(),
		TWITTER_REFRESH_TOKEN: z.string().optional(),
	},
	runtimeEnv: process.env,
});

export type Env = typeof env;

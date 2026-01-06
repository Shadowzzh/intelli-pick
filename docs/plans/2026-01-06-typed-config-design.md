# 类型安全配置系统设计

## 概述

将 yaml 配置迁移到 TypeScript 配置文件，使用 T3-env 验证环境变量，实现完整的类型安全和运行时验证。

## 包结构

```
packages/
├── env/                    # 环境变量验证
│   ├── src/
│   │   └── index.ts        # T3-env 定义
│   └── package.json
│
├── config/                 # 配置类型和加载器
│   ├── src/
│   │   ├── index.ts        # 导出 defineConfig, loadConfig
│   │   ├── schema.ts       # Zod schema
│   │   └── loader.ts       # jiti 动态加载逻辑
│   └── package.json
│
└── db/                     # 改为从 @ai-filter/env 导入

config.ts                   # 根目录，用户配置文件
```

**依赖关系：**

- `packages/env` → 无依赖（最底层）
- `packages/config` → 依赖 `packages/env`
- `packages/db` → 依赖 `packages/env`
- `apps/api` → 依赖 `packages/config`

## packages/env 实现

```ts
// packages/env/src/index.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // 数据库
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().url(),

    // AI Providers
    DEEPSEEK_API_KEY: z.string().min(1),
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
```

## packages/config 实现

```ts
// packages/config/src/schema.ts
import { z } from "zod";

const TwitterConfigSchema = z.object({
  mode: z.enum(["home", "list", "user"]),
  listId: z.string().optional(),
  usernames: z.array(z.string()).optional(),
  maxResults: z.number().default(20),
});

const RssConfigSchema = z.object({
  url: z.string().url(),
});

const V2exConfigSchema = z.object({
  node: z.string().default("hot"),
});

const SourceSchema = z.object({
  name: z.string(),
  type: z.enum(["twitter", "rss", "v2ex"]),
  enabled: z.boolean().default(true),
  fetchInterval: z.number().default(3600),
  config: z.union([TwitterConfigSchema, RssConfigSchema, V2exConfigSchema]),
});

const HardRulesSchema = z.object({
  enabled: z.boolean().default(true),
  blacklistDomains: z.array(z.string()).default([]),
  spamKeywords: z.array(z.string()).default([]),
});

const ThresholdsSchema = z.object({
  passMinValueScore: z.number().default(30),
  rejectMaxValueScore: z.number().default(15),
  quarantineOnSafety: z.boolean().default(true),
});

export const ConfigSchema = z.object({
  sources: z.array(SourceSchema),
  filter: z.object({
    hardRules: HardRulesSchema,
    thresholds: ThresholdsSchema,
  }),
  scheduler: z.object({
    timezone: z.string().default("Asia/Shanghai"),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;
```

```ts
// packages/config/src/index.ts
import { resolve } from "node:path";
import { createJiti } from "jiti";
import { ConfigSchema } from "./schema";
import type { Config } from "./schema";

export function defineConfig<T extends Config>(config: T): T {
  return config;
}

export async function loadConfig(path = "config.ts"): Promise<Config> {
  const jiti = createJiti(import.meta.url);
  const mod = await jiti.import(resolve(process.cwd(), path));
  const raw = (mod as { default: unknown }).default;
  return ConfigSchema.parse(raw);
}

export type { Config };
```

## 根目录 config.ts 示例

```ts
// config.ts
import { defineConfig } from "@ai-filter/config";

export default defineConfig({
  sources: [
    {
      name: "v2ex-hot",
      type: "v2ex",
      fetchInterval: 1800,
      config: { node: "hot" },
    },
    {
      name: "tech-rss",
      type: "rss",
      config: { url: "https://example.com/feed.xml" },
    },
  ],
  filter: {
    hardRules: {
      blacklistDomains: ["spam.com"],
      spamKeywords: ["广告", "推广"],
    },
    thresholds: {
      passMinValueScore: 30,
      rejectMaxValueScore: 15,
    },
  },
  scheduler: {
    timezone: "Asia/Shanghai",
  },
});
```

## 应用使用方式

```ts
// apps/api/src/index.ts
import { env } from "@ai-filter/env";
import { loadConfig } from "@ai-filter/config";

const config = await loadConfig();

// 环境变量（类型安全）
const redis = new Redis(env.REDIS_URL);

// AI 调用
const ai = createAI({
  provider: "deepseek",
  apiKey: env.DEEPSEEK_API_KEY,
});
```

```ts
// packages/db/src/client.ts
import { env } from "@ai-filter/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

## 改动清单

1. 新增 `packages/env` - T3-env 环境变量验证
2. 新增 `packages/config` - defineConfig 和 loadConfig
3. 新增 `config.ts` - 根目录配置文件
4. 删除 `config.yaml`
5. 修改 `packages/db/src/client.ts` - 使用 env 包
6. 修改 `apps/api/src/lib/config.ts` - 移除，改用 packages/config
7. 修改 `apps/api` 中使用配置的地方

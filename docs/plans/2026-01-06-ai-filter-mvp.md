# AI Filter MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个 AI 驱动的信息过滤系统，从多个信息源（Twitter、RSS、V2EX）采集内容，通过硬规则+AI进行过滤、提取和分类，结构化存储到数据库。

**Architecture:** 采用 Monorepo 架构，分为采集层（Collector）、处理层（Pipeline）、存储层（DB）。采集器插件化设计，统一输出 RawContent；Pipeline 包含去重、硬规则过滤、AI过滤、AI提取分类四个步骤；使用 BullMQ 作为任务队列实现异步处理。

**Tech Stack:** TypeScript, Turborepo, pnpm, Drizzle ORM, PostgreSQL, BullMQ, Redis, Vercel AI SDK, twitter-api-v2, rss-parser, cheerio

---

## Phase 1: 项目初始化

### Task 1: 初始化 Monorepo 项目结构

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `biome.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: 初始化 package.json**

```json
{
  "name": "ai-filter",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "db:generate": "turbo db:generate",
    "db:migrate": "turbo db:migrate"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=18"
  }
}
```

**Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: 创建 turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

**Step 4: 创建 biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  }
}
```

**Step 5: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

**Step 6: 创建 .gitignore**

```
node_modules/
dist/
.turbo/
*.log
.env
.env.local
```

**Step 7: 安装依赖**

Run: `pnpm install`
Expected: 依赖安装成功

**Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: initialize monorepo with turbo + pnpm + biome"
```

---

### Task 2: 创建 packages/shared 共享类型包

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/raw-content.ts`
- Create: `packages/shared/src/types/filter-result.ts`
- Create: `packages/shared/src/types/extract-result.ts`

**Step 1: 创建 package.json**

```json
{
  "name": "@ai-filter/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: 创建 raw-content.ts**

```typescript
// packages/shared/src/types/raw-content.ts

/**
 * 所有 Collector 插件的统一输出格式
 */
export interface RawContent {
  // 来源标识
  sourceType: string;          // "twitter" | "rss" | "v2ex"
  sourceId: string;            // 配置中的 source id
  externalId: string;          // 原平台的唯一 ID

  // 内容
  title: string | null;        // 标题（Twitter 可能没有）
  content: string;             // 正文/推文内容
  url: string;                 // 原文链接
  author: string | null;       // 作者

  // 时间
  publishedAt: Date | null;    // 发布时间
  collectedAt: Date;           // 采集时间

  // 原始数据（可选，调试用）
  raw?: unknown;
}
```

**Step 4: 创建 filter-result.ts**

```typescript
// packages/shared/src/types/filter-result.ts

/**
 * AI 过滤输出结构
 */
export interface FilterResult {
  decision: "pass" | "reject" | "quarantine";
  valueScore: number;          // 0-100 信息价值
  noiseScore: number;          // 0-100 噪声程度
  safety: {
    nsfwSexual: number;        // 0-3
    harassment: number;        // 0-3
    scam: number;              // 0-3
  };
  reasons: FilterReason[];
  signals: FilterSignal[];
  oneLineWhy: string;
}

export type FilterReason =
  | "AD_SPAM"
  | "LOW_SIGNAL"
  | "PURE_EMOTION"
  | "NSFW_SEXUAL"
  | "HARASSMENT"
  | "SCAM"
  | "DUPLICATE"
  | "BREAKING_NEWS_STYLE"
  | "HAS_EVIDENCE"
  | "WATCHLIST_OVERRIDE";

export type FilterSignal =
  | "hasNumbers"
  | "hasSourceLink"
  | "hasNamedEntities"
  | "hasConcreteClaim"
  | "isBreakingStyle"
  | "hasCodeBlock"
  | "hasQuote"
  | "mentionsProduct"
  | "mentionsPerson"
  | "hasDataPoint";
```

**Step 5: 创建 extract-result.ts**

```typescript
// packages/shared/src/types/extract-result.ts

/**
 * AI 提取+分类输出结构
 */
export interface ExtractResult {
  title: string;
  summary: string;
  keyPoints: string[];
  dataPoints: string[];
  entities: ExtractedEntity[];
  category: string;
  tags: string[];
}

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  url?: string;
  description?: string;
}

export type EntityType =
  | "tool"
  | "project"
  | "library"
  | "article"
  | "person"
  | "company"
  | "event";
```

**Step 6: 创建 index.ts**

```typescript
// packages/shared/src/index.ts

export * from "./types/raw-content.js";
export * from "./types/filter-result.js";
export * from "./types/extract-result.js";
```

**Step 7: 安装依赖**

Run: `pnpm install`
Expected: 安装成功

**Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared types package (RawContent, FilterResult, ExtractResult)"
```

---

### Task 3: 创建 packages/db 数据库包

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/schema/sources.ts`
- Create: `packages/db/src/schema/contents.ts`
- Create: `packages/db/src/schema/entities.ts`
- Create: `packages/db/src/schema/entity-mentions.ts`
- Create: `packages/db/src/schema/tags.ts`
- Create: `packages/db/src/schema/quarantine.ts`
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/index.ts`

**Step 1: 创建 package.json**

```json
{
  "name": "@ai-filter/db",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.38.0",
    "postgres": "^3.4.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0",
    "typescript": "^5.7.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "drizzle.config.ts"]
}
```

**Step 3: 创建 drizzle.config.ts**

```typescript
// packages/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 4: 创建 src/client.ts**

```typescript
// packages/db/src/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export type Database = typeof db;
```

**Step 5: 创建 src/schema/sources.ts**

```typescript
// packages/db/src/schema/sources.ts
import { pgTable, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const sources = pgTable("sources", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  type: text("type").notNull(),                    // twitter | rss | v2ex
  config: jsonb("config").notNull(),               // 类型相关配置
  enabled: boolean("enabled").default(true),
  fetchInterval: integer("fetch_interval").default(3600),
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
```

**Step 6: 创建 src/schema/contents.ts**

```typescript
// packages/db/src/schema/contents.ts
import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { sources } from "./sources.js";

export const contents = pgTable("contents", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),

  // 来源
  sourceId: text("source_id").references(() => sources.id),
  externalId: text("external_id"),
  url: text("url"),
  author: text("author"),

  // 原始内容（PostgreSQL TOAST 自动压缩）
  rawContent: text("raw_content").notNull(),

  // AI 提取的结构化信息
  title: text("title"),
  summary: text("summary"),
  keyPoints: jsonb("key_points").$type<string[]>(),
  dataPoints: jsonb("data_points").$type<string[]>(),
  contentType: text("content_type"),              // single | aggregation

  // AI 分类结果
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),

  // 过滤结果（用于回放）
  filterVersion: text("filter_version"),
  filterResult: jsonb("filter_result"),

  // 时间
  publishedAt: timestamp("published_at"),
  collectedAt: timestamp("collected_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;
```

**Step 7: 创建 src/schema/entities.ts**

```typescript
// packages/db/src/schema/entities.ts
import { pgTable, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const entities = pgTable("entities", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  type: text("type").notNull(),                   // tool | project | library | article | person | company
  url: text("url"),
  description: text("description"),

  // 统计
  mentionCount: integer("mention_count").default(1),
  firstMentionedAt: timestamp("first_mentioned_at"),
  lastMentionedAt: timestamp("last_mentioned_at"),

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
```

**Step 8: 创建 src/schema/entity-mentions.ts**

```typescript
// packages/db/src/schema/entity-mentions.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { entities } from "./entities.js";
import { contents } from "./contents.js";
import { sources } from "./sources.js";

export const entityMentions = pgTable("entity_mentions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  entityId: text("entity_id").references(() => entities.id),
  contentId: text("content_id").references(() => contents.id),
  sourceId: text("source_id").references(() => sources.id),
  context: text("context"),
  mentionedAt: timestamp("mentioned_at").defaultNow(),
});

export type EntityMention = typeof entityMentions.$inferSelect;
export type NewEntityMention = typeof entityMentions.$inferInsert;
```

**Step 9: 创建 src/schema/tags.ts**

```typescript
// packages/db/src/schema/tags.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const tags = pgTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull().unique(),
  category: text("category"),                     // 大类
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
```

**Step 10: 创建 src/schema/quarantine.ts**

```typescript
// packages/db/src/schema/quarantine.ts
import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { sources } from "./sources.js";

export const quarantine = pgTable("quarantine", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),

  // 来源
  sourceId: text("source_id").references(() => sources.id),
  externalId: text("external_id"),
  url: text("url"),
  author: text("author"),

  // 原始内容
  rawContent: text("raw_content").notNull(),

  // 过滤结果
  filterVersion: text("filter_version"),
  decision: text("decision").notNull(),           // reject | quarantine
  valueScore: integer("value_score"),
  noiseScore: integer("noise_score"),
  safety: jsonb("safety"),
  reasons: jsonb("reasons").$type<string[]>(),
  signals: jsonb("signals").$type<string[]>(),
  oneLineWhy: text("one_line_why"),

  // 生命周期
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type Quarantine = typeof quarantine.$inferSelect;
export type NewQuarantine = typeof quarantine.$inferInsert;
```

**Step 11: 创建 src/schema/index.ts**

```typescript
// packages/db/src/schema/index.ts
export * from "./sources.js";
export * from "./contents.js";
export * from "./entities.js";
export * from "./entity-mentions.js";
export * from "./tags.js";
export * from "./quarantine.js";
```

**Step 12: 创建 src/index.ts**

```typescript
// packages/db/src/index.ts
export * from "./client.js";
export * from "./schema/index.js";
```

**Step 13: 安装依赖**

Run: `pnpm install`
Expected: 安装成功

**Step 14: Commit**

```bash
git add packages/db
git commit -m "feat: add database package with Drizzle schema"
```

---

## Phase 2: 采集模块 (Collector)

### Task 4: 创建 apps/api 基础结构

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/lib/config.ts`
- Create: `apps/api/src/lib/logger.ts`
- Create: `config.example.yaml`

**Step 1: 创建 package.json**

```json
{
  "name": "@ai-filter/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@ai-filter/shared": "workspace:*",
    "@ai-filter/db": "workspace:*",
    "ai": "^4.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.4.0",
    "twitter-api-v2": "^1.18.0",
    "rss-parser": "^3.13.0",
    "cheerio": "^1.0.0",
    "undici": "^7.0.0",
    "zod": "^3.24.0",
    "pino": "^9.0.0",
    "cron": "^3.2.0",
    "dayjs": "^1.11.0",
    "yaml": "^2.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: 创建 src/lib/config.ts**

```typescript
// apps/api/src/lib/config.ts
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";

// Twitter 配置
const TwitterConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  mode: z.enum(["home", "list", "user"]),
  listId: z.string().optional(),
  usernames: z.array(z.string()).optional(),
  maxResults: z.number().default(20),
});

// RSS 配置
const RssConfigSchema = z.object({
  url: z.string().url(),
});

// V2EX 配置
const V2exConfigSchema = z.object({
  node: z.string().default("hot"),
});

// Source 配置
const SourceSchema = z.object({
  name: z.string(),
  type: z.enum(["twitter", "rss", "v2ex"]),
  enabled: z.boolean().default(true),
  fetchInterval: z.number().default(3600),
  config: z.union([TwitterConfigSchema, RssConfigSchema, V2exConfigSchema]),
});

// AI 任务配置
const AiTaskSchema = z.object({
  provider: z.string(),
  model: z.string(),
});

// 硬规则配置
const HardRulesSchema = z.object({
  enabled: z.boolean().default(true),
  blacklistDomains: z.array(z.string()).default([]),
  spamKeywords: z.array(z.string()).default([]),
});

// 过滤阈值配置
const ThresholdsSchema = z.object({
  passMinValueScore: z.number().default(30),
  rejectMaxValueScore: z.number().default(15),
  quarantineOnSafety: z.boolean().default(true),
});

// 完整配置
const ConfigSchema = z.object({
  ai: z.object({
    providers: z.record(z.object({
      baseUrl: z.string().optional(),
      apiKey: z.string(),
    })),
    tasks: z.object({
      filter: AiTaskSchema,
      extractAndClassify: AiTaskSchema,
    }),
  }),
  sources: z.array(SourceSchema),
  filter: z.object({
    hardRules: HardRulesSchema,
    thresholds: ThresholdsSchema,
    promptVersion: z.string().default("v1.0"),
    quarantineTTLDays: z.number().default(30),
  }),
  scheduler: z.object({
    timezone: z.string().default("Asia/Shanghai"),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;
export type SourceConfig = z.infer<typeof SourceSchema>;
export type TwitterConfig = z.infer<typeof TwitterConfigSchema>;
export type RssConfig = z.infer<typeof RssConfigSchema>;
export type V2exConfig = z.infer<typeof V2exConfigSchema>;

// 替换环境变量
function replaceEnvVars(obj: unknown): unknown {
  if (typeof obj === "string") {
    return obj.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || "");
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceEnvVars);
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceEnvVars(v)])
    );
  }
  return obj;
}

export function loadConfig(path = "config.yaml"): Config {
  const raw = readFileSync(path, "utf-8");
  const parsed = parse(raw);
  const replaced = replaceEnvVars(parsed);
  return ConfigSchema.parse(replaced);
}
```

**Step 4: 创建 src/lib/logger.ts**

```typescript
// apps/api/src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

export function createLogger(name: string) {
  return logger.child({ name });
}
```

**Step 5: 创建 src/index.ts**

```typescript
// apps/api/src/index.ts
import { loadConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";

const logger = createLogger("main");

async function main() {
  logger.info("Starting AI Filter...");

  const config = loadConfig();
  logger.info({ sources: config.sources.length }, "Loaded config");

  // TODO: Initialize collector, pipeline, scheduler
}

main().catch((err) => {
  logger.error(err, "Fatal error");
  process.exit(1);
});
```

**Step 6: 创建 config.example.yaml**

```yaml
# config.example.yaml - 复制为 config.yaml 并填入真实值

ai:
  providers:
    deepseek:
      baseUrl: https://api.deepseek.com/v1
      apiKey: ${DEEPSEEK_API_KEY}

    anthropic:
      apiKey: ${ANTHROPIC_API_KEY}

  tasks:
    filter:
      provider: deepseek
      model: deepseek-chat

    extractAndClassify:
      provider: anthropic
      model: claude-sonnet-4-20250514

sources:
  # RSS 示例
  - name: "Hacker News"
    type: rss
    enabled: true
    fetchInterval: 3600
    config:
      url: https://hnrss.org/frontpage

  # V2EX 示例
  - name: "V2EX 热门"
    type: v2ex
    enabled: true
    fetchInterval: 3600
    config:
      node: hot

  # Twitter 示例
  - name: "Twitter 推荐"
    type: twitter
    enabled: false
    fetchInterval: 3600
    config:
      clientId: ${TWITTER_CLIENT_ID}
      clientSecret: ${TWITTER_CLIENT_SECRET}
      accessToken: ${TWITTER_ACCESS_TOKEN}
      refreshToken: ${TWITTER_REFRESH_TOKEN}
      mode: home
      maxResults: 50

filter:
  hardRules:
    enabled: true
    blacklistDomains:
      - "bit.ly/spam"
    spamKeywords:
      - "微信群"
      - "返利"
      - "优惠码"
      - "开户"
      - "代投"
      - "包赚"

  thresholds:
    passMinValueScore: 30
    rejectMaxValueScore: 15
    quarantineOnSafety: true

  promptVersion: "v1.0"
  quarantineTTLDays: 30

scheduler:
  timezone: Asia/Shanghai
```

**Step 7: 安装依赖**

Run: `pnpm install`
Expected: 安装成功

**Step 8: 测试运行**

Run: `cp config.example.yaml config.yaml && pnpm --filter @ai-filter/api dev`
Expected: 看到 "Starting AI Filter..." 日志

**Step 9: Commit**

```bash
git add apps/api config.example.yaml
git commit -m "feat: add api app with config and logger"
```

---

### Task 5: 实现 Collector 插件架构

**Files:**
- Create: `apps/api/src/collector/types.ts`
- Create: `apps/api/src/collector/manager.ts`
- Create: `apps/api/src/collector/plugins/rss.ts`
- Create: `apps/api/src/collector/plugins/v2ex.ts`
- Create: `apps/api/src/collector/plugins/twitter.ts`
- Create: `apps/api/src/collector/plugins/index.ts`
- Create: `apps/api/src/collector/index.ts`

**Step 1: 创建 types.ts**

```typescript
// apps/api/src/collector/types.ts
import type { RawContent } from "@ai-filter/shared";
import type { SourceConfig } from "../lib/config.js";

export interface CollectorPlugin {
  type: string;
  collect(source: SourceConfig): Promise<RawContent[]>;
}
```

**Step 2: 创建 manager.ts**

```typescript
// apps/api/src/collector/manager.ts
import type { RawContent } from "@ai-filter/shared";
import type { SourceConfig } from "../lib/config.js";
import type { CollectorPlugin } from "./types.js";
import { createLogger } from "../lib/logger.js";

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
      logger.info({ name: source.name, type: source.type }, "Collecting from source");
      const results = await plugin.collect(source);
      logger.info({ name: source.name, count: results.length }, "Collected items");
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
```

**Step 3: 创建 plugins/rss.ts**

```typescript
// apps/api/src/collector/plugins/rss.ts
import Parser from "rss-parser";
import type { RawContent } from "@ai-filter/shared";
import type { SourceConfig, RssConfig } from "../../lib/config.js";
import type { CollectorPlugin } from "../types.js";

const parser = new Parser();

export const rssPlugin: CollectorPlugin = {
  type: "rss",

  async collect(source: SourceConfig): Promise<RawContent[]> {
    const config = source.config as RssConfig;
    const feed = await parser.parseURL(config.url);

    return (feed.items || []).map((item) => ({
      sourceType: "rss",
      sourceId: source.name,
      externalId: item.guid || item.link || "",
      title: item.title || null,
      content: item.contentSnippet || item.content || "",
      url: item.link || "",
      author: item.creator || item.author || null,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      collectedAt: new Date(),
      raw: item,
    }));
  },
};
```

**Step 4: 创建 plugins/v2ex.ts**

```typescript
// apps/api/src/collector/plugins/v2ex.ts
import { fetch } from "undici";
import type { RawContent } from "@ai-filter/shared";
import type { SourceConfig, V2exConfig } from "../../lib/config.js";
import type { CollectorPlugin } from "../types.js";

interface V2exTopic {
  id: number;
  title: string;
  content: string;
  content_rendered: string;
  url: string;
  member: { username: string };
  created: number;
}

export const v2exPlugin: CollectorPlugin = {
  type: "v2ex",

  async collect(source: SourceConfig): Promise<RawContent[]> {
    const config = source.config as V2exConfig;
    const apiUrl = config.node === "hot"
      ? "https://www.v2ex.com/api/topics/hot.json"
      : `https://www.v2ex.com/api/topics/show.json?node_name=${config.node}`;

    const response = await fetch(apiUrl);
    const topics = (await response.json()) as V2exTopic[];

    return topics.map((topic) => ({
      sourceType: "v2ex",
      sourceId: source.name,
      externalId: String(topic.id),
      title: topic.title,
      content: topic.content || topic.content_rendered || "",
      url: topic.url || `https://www.v2ex.com/t/${topic.id}`,
      author: topic.member?.username || null,
      publishedAt: topic.created ? new Date(topic.created * 1000) : null,
      collectedAt: new Date(),
      raw: topic,
    }));
  },
};
```

**Step 5: 创建 plugins/twitter.ts**

```typescript
// apps/api/src/collector/plugins/twitter.ts
import { TwitterApi } from "twitter-api-v2";
import type { RawContent } from "@ai-filter/shared";
import type { SourceConfig, TwitterConfig } from "../../lib/config.js";
import type { CollectorPlugin } from "../types.js";
import { createLogger } from "../../lib/logger.js";

const logger = createLogger("twitter-plugin");

export const twitterPlugin: CollectorPlugin = {
  type: "twitter",

  async collect(source: SourceConfig): Promise<RawContent[]> {
    const config = source.config as TwitterConfig;

    const client = new TwitterApi({
      appKey: config.clientId,
      appSecret: config.clientSecret,
      accessToken: config.accessToken,
      accessSecret: config.refreshToken, // OAuth 1.0a 使用
    });

    const results: RawContent[] = [];

    try {
      if (config.mode === "home") {
        // Home Timeline
        const timeline = await client.v2.homeTimeline({
          max_results: config.maxResults,
          "tweet.fields": ["created_at", "author_id", "text"],
          expansions: ["author_id"],
        });

        for (const tweet of timeline.data.data || []) {
          results.push({
            sourceType: "twitter",
            sourceId: source.name,
            externalId: tweet.id,
            title: null,
            content: tweet.text,
            url: `https://twitter.com/i/web/status/${tweet.id}`,
            author: tweet.author_id || null,
            publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
            collectedAt: new Date(),
            raw: tweet,
          });
        }
      } else if (config.mode === "user" && config.usernames) {
        // User Timeline
        for (const username of config.usernames) {
          try {
            const user = await client.v2.userByUsername(username);
            if (!user.data) continue;

            const tweets = await client.v2.userTimeline(user.data.id, {
              max_results: config.maxResults,
              "tweet.fields": ["created_at", "text"],
            });

            for (const tweet of tweets.data.data || []) {
              results.push({
                sourceType: "twitter",
                sourceId: source.name,
                externalId: tweet.id,
                title: null,
                content: tweet.text,
                url: `https://twitter.com/${username}/status/${tweet.id}`,
                author: username,
                publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
                collectedAt: new Date(),
                raw: tweet,
              });
            }
          } catch (err) {
            logger.error({ err, username }, "Failed to fetch user timeline");
          }
        }
      } else if (config.mode === "list" && config.listId) {
        // List Timeline
        const listTweets = await client.v2.listTweets(config.listId, {
          max_results: config.maxResults,
          "tweet.fields": ["created_at", "author_id", "text"],
        });

        for (const tweet of listTweets.data.data || []) {
          results.push({
            sourceType: "twitter",
            sourceId: source.name,
            externalId: tweet.id,
            title: null,
            content: tweet.text,
            url: `https://twitter.com/i/web/status/${tweet.id}`,
            author: tweet.author_id || null,
            publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
            collectedAt: new Date(),
            raw: tweet,
          });
        }
      }
    } catch (err) {
      logger.error({ err, mode: config.mode }, "Failed to fetch tweets");
    }

    return results;
  },
};
```

**Step 6: 创建 plugins/index.ts**

```typescript
// apps/api/src/collector/plugins/index.ts
export { rssPlugin } from "./rss.js";
export { v2exPlugin } from "./v2ex.js";
export { twitterPlugin } from "./twitter.js";
```

**Step 7: 创建 collector/index.ts**

```typescript
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
```

**Step 8: 更新 src/index.ts 测试采集**

```typescript
// apps/api/src/index.ts
import { loadConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";
import { createCollectorManager } from "./collector/index.js";

const logger = createLogger("main");

async function main() {
  logger.info("Starting AI Filter...");

  const config = loadConfig();
  logger.info({ sources: config.sources.length }, "Loaded config");

  // 初始化采集器
  const collector = createCollectorManager();

  // 测试采集
  const items = await collector.collectAll(config.sources);
  logger.info({ total: items.length }, "Collected items");

  for (const item of items.slice(0, 3)) {
    logger.info({
      source: item.sourceId,
      title: item.title?.slice(0, 50),
      url: item.url,
    }, "Sample item");
  }
}

main().catch((err) => {
  logger.error(err, "Fatal error");
  process.exit(1);
});
```

**Step 9: 测试运行**

Run: `pnpm --filter @ai-filter/api dev`
Expected: 看到采集到的内容日志

**Step 10: Commit**

```bash
git add apps/api/src/collector
git commit -m "feat: add collector module with RSS, V2EX, Twitter plugins"
```

---

## Phase 3: 处理流水线 (Pipeline)

### Task 6: 实现去重和硬规则过滤

**Files:**
- Create: `apps/api/src/pipeline/types.ts`
- Create: `apps/api/src/pipeline/dedup.ts`
- Create: `apps/api/src/pipeline/hard-filter.ts`

**Step 1: 创建 types.ts**

```typescript
// apps/api/src/pipeline/types.ts
import type { RawContent, FilterResult, ExtractResult } from "@ai-filter/shared";

export interface PipelineContext {
  raw: RawContent;
  filterResult?: FilterResult;
  extractResult?: ExtractResult;
}

export interface PipelineStep {
  name: string;
  process(ctx: PipelineContext): Promise<PipelineContext | null>;
}
```

**Step 2: 创建 dedup.ts**

```typescript
// apps/api/src/pipeline/dedup.ts
import { db, contents } from "@ai-filter/db";
import { eq, or } from "drizzle-orm";
import type { PipelineContext, PipelineStep } from "./types.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("dedup");

export class DedupStep implements PipelineStep {
  name = "dedup";

  async process(ctx: PipelineContext): Promise<PipelineContext | null> {
    const { raw } = ctx;

    // 检查 URL 或 externalId 是否已存在
    const existing = await db.query.contents.findFirst({
      where: or(
        eq(contents.url, raw.url),
        eq(contents.externalId, raw.externalId)
      ),
    });

    if (existing) {
      logger.debug({ url: raw.url, externalId: raw.externalId }, "Duplicate found, skipping");
      return null;
    }

    return ctx;
  }
}
```

**Step 3: 创建 hard-filter.ts**

```typescript
// apps/api/src/pipeline/hard-filter.ts
import type { Config } from "../lib/config.js";
import type { PipelineContext, PipelineStep } from "./types.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("hard-filter");

// 纯表情/纯脏话正则
const PURE_EMOJI_REGEX = /^[\s\p{Emoji}\p{Emoji_Component}]+$/u;
const PURE_NOISE_REGEX = /^[\s哈嘿呵嘻666好的可以是的对啊卧槽艹牛逼nb厉害👍🏻👎😂🤣😭😅🙏]+$/i;

export class HardFilterStep implements PipelineStep {
  name = "hard-filter";

  constructor(private config: Config["filter"]["hardRules"]) {}

  async process(ctx: PipelineContext): Promise<PipelineContext | null> {
    if (!this.config.enabled) {
      return ctx;
    }

    const { raw } = ctx;
    const content = raw.content.toLowerCase();
    const url = raw.url.toLowerCase();

    // 检查黑名单域名
    for (const domain of this.config.blacklistDomains) {
      if (url.includes(domain.toLowerCase())) {
        logger.debug({ url, domain }, "Blocked by blacklist domain");
        return null;
      }
    }

    // 检查垃圾关键词
    for (const keyword of this.config.spamKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        logger.debug({ keyword }, "Blocked by spam keyword");
        return null;
      }
    }

    // 检查纯表情/纯噪声
    const trimmed = raw.content.trim();
    if (PURE_EMOJI_REGEX.test(trimmed) || PURE_NOISE_REGEX.test(trimmed)) {
      logger.debug({ content: trimmed.slice(0, 50) }, "Blocked: pure emoji/noise");
      return null;
    }

    // 检查过短且无链接
    if (trimmed.length < 20 && !raw.url && !content.includes("http")) {
      logger.debug({ length: trimmed.length }, "Blocked: too short without links");
      return null;
    }

    return ctx;
  }
}
```

**Step 4: Commit**

```bash
git add apps/api/src/pipeline
git commit -m "feat: add dedup and hard-filter pipeline steps"
```

---

### Task 7: 实现 AI 过滤

**Files:**
- Create: `apps/api/src/lib/ai.ts`
- Create: `apps/api/src/pipeline/ai-filter.ts`

**Step 1: 创建 ai.ts**

```typescript
// apps/api/src/lib/ai.ts
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { Config } from "./config.js";

export function createAiClient(config: Config["ai"]) {
  const providers: Record<string, ReturnType<typeof createOpenAI> | ReturnType<typeof createAnthropic>> = {};

  for (const [name, providerConfig] of Object.entries(config.providers)) {
    if (name === "anthropic") {
      providers[name] = createAnthropic({
        apiKey: providerConfig.apiKey,
      });
    } else {
      // OpenAI 兼容 (DeepSeek 等)
      providers[name] = createOpenAI({
        baseURL: providerConfig.baseUrl,
        apiKey: providerConfig.apiKey,
      });
    }
  }

  return {
    getModel(taskName: keyof Config["ai"]["tasks"]) {
      const task = config.tasks[taskName];
      const provider = providers[task.provider];
      if (!provider) {
        throw new Error(`Provider ${task.provider} not configured`);
      }
      return provider(task.model);
    },
  };
}

export type AiClient = ReturnType<typeof createAiClient>;
```

**Step 2: 创建 ai-filter.ts**

```typescript
// apps/api/src/pipeline/ai-filter.ts
import { generateObject } from "ai";
import { z } from "zod";
import type { FilterResult } from "@ai-filter/shared";
import type { AiClient } from "../lib/ai.js";
import type { Config } from "../lib/config.js";
import type { PipelineContext, PipelineStep } from "./types.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("ai-filter");

const FilterResultSchema = z.object({
  decision: z.enum(["pass", "reject", "quarantine"]),
  valueScore: z.number().min(0).max(100),
  noiseScore: z.number().min(0).max(100),
  safety: z.object({
    nsfwSexual: z.number().min(0).max(3),
    harassment: z.number().min(0).max(3),
    scam: z.number().min(0).max(3),
  }),
  reasons: z.array(z.string()),
  signals: z.array(z.string()),
  oneLineWhy: z.string(),
});

const FILTER_PROMPT = `你是一个内容过滤器。判断以下内容是否应该进入后续处理流程。

## 判定优先级
安全合规 > 信息价值 > 噪声控制

## 特别规则
- 短文本不等于低价值
- 大V对喷若含可验证信息要保留

## 判定标准

### quarantine（隔离）
- 明确色情招嫖、未成年人性相关
- 强诈骗导流
- 个人隐私曝光

### reject（丢弃）
- 广告导流、重复灌水
- 纯情绪表达、无对象无事件
- 无信息增量

### pass（通过）
- 有事件、有对象、有线索
- 出现实体（公司/产品/人物/项目）+ 动作/事件 + 可追踪线索
- 有爆料、风险提示、反驳证据、数据/截图描述

## signals 可选值
hasNumbers, hasSourceLink, hasNamedEntities, hasConcreteClaim, isBreakingStyle, hasCodeBlock, hasQuote, mentionsProduct, mentionsPerson, hasDataPoint

## reasons 可选值
AD_SPAM, LOW_SIGNAL, PURE_EMOTION, NSFW_SEXUAL, HARASSMENT, SCAM, DUPLICATE, BREAKING_NEWS_STYLE, HAS_EVIDENCE, WATCHLIST_OVERRIDE

## 输入
作者: {{author}}
来源: {{sourceType}}
内容:
{{content}}

根据以上规则，输出 JSON 判定结果。`;

export class AiFilterStep implements PipelineStep {
  name = "ai-filter";

  constructor(
    private ai: AiClient,
    private config: Config["filter"]
  ) {}

  async process(ctx: PipelineContext): Promise<PipelineContext | null> {
    const { raw } = ctx;

    const prompt = FILTER_PROMPT
      .replace("{{author}}", raw.author || "unknown")
      .replace("{{sourceType}}", raw.sourceType)
      .replace("{{content}}", raw.content);

    try {
      const { object } = await generateObject({
        model: this.ai.getModel("filter"),
        schema: FilterResultSchema,
        prompt,
      });

      const result = object as FilterResult;
      logger.info({
        decision: result.decision,
        valueScore: result.valueScore,
        noiseScore: result.noiseScore,
      }, "AI filter result");

      // 应用阈值调整
      if (result.decision === "pass" && result.valueScore < this.config.thresholds.passMinValueScore) {
        result.decision = "reject";
        result.reasons.push("BELOW_VALUE_THRESHOLD");
      }

      // 安全检查
      if (this.config.thresholds.quarantineOnSafety) {
        const { safety } = result;
        if (safety.nsfwSexual >= 2 || safety.harassment >= 2 || safety.scam >= 2) {
          result.decision = "quarantine";
        }
      }

      ctx.filterResult = result;

      if (result.decision === "reject") {
        return null;
      }

      return ctx;
    } catch (err) {
      logger.error({ err }, "AI filter failed");
      // 失败时默认通过，避免丢失内容
      ctx.filterResult = {
        decision: "pass",
        valueScore: 50,
        noiseScore: 50,
        safety: { nsfwSexual: 0, harassment: 0, scam: 0 },
        reasons: ["AI_FILTER_ERROR"],
        signals: [],
        oneLineWhy: "AI filter failed, defaulting to pass",
      };
      return ctx;
    }
  }
}
```

**Step 3: Commit**

```bash
git add apps/api/src/lib/ai.ts apps/api/src/pipeline/ai-filter.ts
git commit -m "feat: add AI filter step with structured output"
```

---

### Task 8: 实现 AI 提取+分类

**Files:**
- Create: `apps/api/src/pipeline/ai-extract.ts`

**Step 1: 创建 ai-extract.ts**

```typescript
// apps/api/src/pipeline/ai-extract.ts
import { generateObject } from "ai";
import { z } from "zod";
import type { ExtractResult } from "@ai-filter/shared";
import type { AiClient } from "../lib/ai.js";
import type { PipelineContext, PipelineStep } from "./types.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("ai-extract");

const ExtractResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  dataPoints: z.array(z.string()),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(["tool", "project", "library", "article", "person", "company", "event"]),
    url: z.string().optional(),
    description: z.string().optional(),
  })),
  category: z.string(),
  tags: z.array(z.string()),
});

const EXTRACT_PROMPT = `你是一个内容分析器。从以下内容中提取结构化信息。

## 提取字段

### title
- 如果原文有标题，使用原标题
- 如果没有（如推文），生成一个简洁的标题（<20字）

### summary
- 用 1-2 句话总结核心内容
- 保留关键信息，去除冗余

### keyPoints
- 提取核心观点、结论、主张
- 每条观点独立成句
- 最多 5 条

### dataPoints
- 提取具体数字、量化信息
- 如：融资金额、性能数据、用户数、价格等
- 格式："[指标] [数值]"

### entities
- 提取提到的实体：工具、项目、库、文章、人物、公司、事件
- 只提取明确提到的，不要推断

### category
- 内容所属大类
- 如：技术、财经、生活、娱乐、政治、科学等

### tags
- 细分标签，3-5 个
- 如：AI、LLM、开源、融资、教程等

## 输入
{{content}}

根据以上要求，输出 JSON 结果。`;

export class AiExtractStep implements PipelineStep {
  name = "ai-extract";

  constructor(private ai: AiClient) {}

  async process(ctx: PipelineContext): Promise<PipelineContext | null> {
    const { raw } = ctx;

    // 如果是 quarantine，跳过提取
    if (ctx.filterResult?.decision === "quarantine") {
      return ctx;
    }

    const prompt = EXTRACT_PROMPT.replace("{{content}}", raw.content);

    try {
      const { object } = await generateObject({
        model: this.ai.getModel("extractAndClassify"),
        schema: ExtractResultSchema,
        prompt,
      });

      ctx.extractResult = object as ExtractResult;

      logger.info({
        title: ctx.extractResult.title,
        category: ctx.extractResult.category,
        tags: ctx.extractResult.tags,
        entitiesCount: ctx.extractResult.entities.length,
      }, "AI extract result");

      return ctx;
    } catch (err) {
      logger.error({ err }, "AI extract failed");
      // 失败时使用基础信息
      ctx.extractResult = {
        title: raw.title || raw.content.slice(0, 50),
        summary: raw.content.slice(0, 200),
        keyPoints: [],
        dataPoints: [],
        entities: [],
        category: "未分类",
        tags: [],
      };
      return ctx;
    }
  }
}
```

**Step 2: Commit**

```bash
git add apps/api/src/pipeline/ai-extract.ts
git commit -m "feat: add AI extract and classify step"
```

---

### Task 9: 实现 Pipeline 主流程和存储

**Files:**
- Create: `apps/api/src/pipeline/storage.ts`
- Create: `apps/api/src/pipeline/index.ts`

**Step 1: 创建 storage.ts**

```typescript
// apps/api/src/pipeline/storage.ts
import { db, contents, entities, entityMentions, quarantine } from "@ai-filter/db";
import { eq } from "drizzle-orm";
import dayjs from "dayjs";
import type { Config } from "../lib/config.js";
import type { PipelineContext, PipelineStep } from "./types.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("storage");

export class StorageStep implements PipelineStep {
  name = "storage";

  constructor(private config: Config["filter"]) {}

  async process(ctx: PipelineContext): Promise<PipelineContext | null> {
    const { raw, filterResult, extractResult } = ctx;

    // 处理 quarantine
    if (filterResult?.decision === "quarantine") {
      await db.insert(quarantine).values({
        sourceId: raw.sourceId,
        externalId: raw.externalId,
        url: raw.url,
        author: raw.author,
        rawContent: raw.content,
        filterVersion: this.config.promptVersion,
        decision: filterResult.decision,
        valueScore: filterResult.valueScore,
        noiseScore: filterResult.noiseScore,
        safety: filterResult.safety,
        reasons: filterResult.reasons,
        signals: filterResult.signals,
        oneLineWhy: filterResult.oneLineWhy,
        expiresAt: dayjs().add(this.config.quarantineTTLDays, "day").toDate(),
      });

      logger.info({ externalId: raw.externalId }, "Stored in quarantine");
      return ctx;
    }

    // 存储内容
    const [content] = await db.insert(contents).values({
      sourceId: raw.sourceId,
      externalId: raw.externalId,
      url: raw.url,
      author: raw.author,
      rawContent: raw.content,
      title: extractResult?.title,
      summary: extractResult?.summary,
      keyPoints: extractResult?.keyPoints,
      dataPoints: extractResult?.dataPoints,
      contentType: "single",
      category: extractResult?.category,
      tags: extractResult?.tags,
      filterVersion: this.config.promptVersion,
      filterResult: filterResult,
      publishedAt: raw.publishedAt,
    }).returning();

    logger.info({ contentId: content.id, title: content.title }, "Stored content");

    // 存储实体和关联
    if (extractResult?.entities) {
      for (const entity of extractResult.entities) {
        // 查找或创建实体
        let existingEntity = await db.query.entities.findFirst({
          where: eq(entities.name, entity.name),
        });

        if (existingEntity) {
          // 更新 mentionCount
          await db.update(entities)
            .set({
              mentionCount: (existingEntity.mentionCount || 0) + 1,
              lastMentionedAt: new Date(),
            })
            .where(eq(entities.id, existingEntity.id));
        } else {
          // 创建新实体
          const [newEntity] = await db.insert(entities).values({
            name: entity.name,
            type: entity.type,
            url: entity.url,
            description: entity.description,
            mentionCount: 1,
            firstMentionedAt: new Date(),
            lastMentionedAt: new Date(),
          }).returning();
          existingEntity = newEntity;
        }

        // 创建关联
        await db.insert(entityMentions).values({
          entityId: existingEntity.id,
          contentId: content.id,
          sourceId: raw.sourceId,
        });
      }
    }

    return ctx;
  }
}
```

**Step 2: 创建 index.ts**

```typescript
// apps/api/src/pipeline/index.ts
import type { RawContent } from "@ai-filter/shared";
import type { Config } from "../lib/config.js";
import type { AiClient } from "../lib/ai.js";
import type { PipelineContext, PipelineStep } from "./types.js";
import { DedupStep } from "./dedup.js";
import { HardFilterStep } from "./hard-filter.js";
import { AiFilterStep } from "./ai-filter.js";
import { AiExtractStep } from "./ai-extract.js";
import { StorageStep } from "./storage.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("pipeline");

export class Pipeline {
  private steps: PipelineStep[] = [];

  constructor(config: Config, ai: AiClient) {
    this.steps = [
      new DedupStep(),
      new HardFilterStep(config.filter.hardRules),
      new AiFilterStep(ai, config.filter),
      new AiExtractStep(ai),
      new StorageStep(config.filter),
    ];
  }

  async process(raw: RawContent): Promise<boolean> {
    let ctx: PipelineContext | null = { raw };

    for (const step of this.steps) {
      if (!ctx) break;

      logger.debug({ step: step.name }, "Running pipeline step");
      ctx = await step.process(ctx);

      if (!ctx) {
        logger.debug({ step: step.name }, "Content filtered out");
        return false;
      }
    }

    return true;
  }

  async processAll(items: RawContent[]): Promise<{ processed: number; passed: number }> {
    let processed = 0;
    let passed = 0;

    for (const item of items) {
      processed++;
      const success = await this.process(item);
      if (success) passed++;
    }

    logger.info({ processed, passed }, "Pipeline completed");
    return { processed, passed };
  }
}

export type { PipelineContext, PipelineStep } from "./types.js";
```

**Step 3: Commit**

```bash
git add apps/api/src/pipeline
git commit -m "feat: add storage step and pipeline orchestrator"
```

---

## Phase 4: 任务队列和调度

### Task 10: 集成 BullMQ 任务队列

**Files:**
- Create: `apps/api/src/worker.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: 创建 worker.ts**

```typescript
// apps/api/src/worker.ts
import { Worker, Queue } from "bullmq";
import type { RawContent } from "@ai-filter/shared";
import type { Config } from "./lib/config.js";
import type { AiClient } from "./lib/ai.js";
import { Pipeline } from "./pipeline/index.js";
import { createLogger } from "./lib/logger.js";

const logger = createLogger("worker");

const QUEUE_NAME = "ai-filter-pipeline";

export function createQueue(redisUrl: string) {
  return new Queue<RawContent>(QUEUE_NAME, {
    connection: { url: redisUrl },
  });
}

export function createWorker(
  redisUrl: string,
  config: Config,
  ai: AiClient
): Worker {
  const pipeline = new Pipeline(config, ai);

  const worker = new Worker<RawContent>(
    QUEUE_NAME,
    async (job) => {
      logger.info({ jobId: job.id, url: job.data.url }, "Processing job");
      const success = await pipeline.process(job.data);
      return { success };
    },
    {
      connection: { url: redisUrl },
      concurrency: 5,
    }
  );

  worker.on("completed", (job, result) => {
    logger.info({ jobId: job.id, success: result.success }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Job failed");
  });

  return worker;
}
```

**Step 2: 更新 index.ts**

```typescript
// apps/api/src/index.ts
import { CronJob } from "cron";
import { loadConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";
import { createAiClient } from "./lib/ai.js";
import { createCollectorManager } from "./collector/index.js";
import { createQueue, createWorker } from "./worker.js";

const logger = createLogger("main");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function main() {
  logger.info("Starting AI Filter...");

  const config = loadConfig();
  logger.info({ sources: config.sources.length }, "Loaded config");

  // 初始化
  const ai = createAiClient(config.ai);
  const collector = createCollectorManager();
  const queue = createQueue(REDIS_URL);
  const worker = createWorker(REDIS_URL, config, ai);

  // 采集任务
  async function collect() {
    logger.info("Starting collection...");
    const items = await collector.collectAll(config.sources);

    for (const item of items) {
      await queue.add("process", item, {
        jobId: `${item.sourceType}-${item.externalId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    }

    logger.info({ count: items.length }, "Added items to queue");
  }

  // 定时调度
  const cronJob = new CronJob(
    "0 * * * *", // 每小时
    collect,
    null,
    true,
    config.scheduler.timezone
  );

  logger.info({ timezone: config.scheduler.timezone }, "Scheduler started");

  // 首次运行
  await collect();

  // 优雅关闭
  process.on("SIGTERM", async () => {
    logger.info("Shutting down...");
    cronJob.stop();
    await worker.close();
    await queue.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(err, "Fatal error");
  process.exit(1);
});
```

**Step 3: 更新 package.json 添加 pino-pretty**

在 apps/api/package.json 的 devDependencies 中添加:

```json
"pino-pretty": "^13.0.0"
```

**Step 4: 安装依赖**

Run: `pnpm install`

**Step 5: Commit**

```bash
git add apps/api
git commit -m "feat: add BullMQ worker and cron scheduler"
```

---

### Task 11: 添加 .env 和最终测试

**Files:**
- Create: `.env.example`
- Modify: `apps/api/src/lib/config.ts` (添加 dotenv)

**Step 1: 创建 .env.example**

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_filter

# Redis
REDIS_URL=redis://localhost:6379

# AI Providers
DEEPSEEK_API_KEY=your_deepseek_key
ANTHROPIC_API_KEY=your_anthropic_key

# Twitter (可选)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_REFRESH_TOKEN=
```

**Step 2: 添加 dotenv 支持**

在 apps/api/package.json 的 dependencies 中添加:

```json
"dotenv": "^16.4.0"
```

**Step 3: 更新 index.ts 加载 .env**

在文件顶部添加:

```typescript
import "dotenv/config";
```

**Step 4: 安装依赖**

Run: `pnpm install`

**Step 5: 生成数据库迁移**

Run: `cd packages/db && pnpm db:generate`
Expected: 生成迁移文件

**Step 6: 应用迁移**

Run: `cd packages/db && pnpm db:push`
Expected: 数据库表创建成功

**Step 7: 启动测试**

Run: `pnpm --filter @ai-filter/api dev`
Expected: 看到采集和处理日志

**Step 8: Final Commit**

```bash
git add .
git commit -m "feat: complete MVP implementation with env config"
```

---

## 总结

### 已实现功能
1. ✅ Monorepo 项目结构 (Turborepo + pnpm)
2. ✅ 共享类型包 (@ai-filter/shared)
3. ✅ 数据库包 (@ai-filter/db) - Drizzle ORM + PostgreSQL
4. ✅ 采集模块 - RSS, V2EX, Twitter 插件
5. ✅ Pipeline - 去重、硬规则、AI过滤、AI提取分类、存储
6. ✅ BullMQ 任务队列
7. ✅ Cron 定时调度

### 后续扩展
- [ ] 推送模块 (Telegram, Email)
- [ ] 定时摘要 (hourly/daily/weekly)
- [ ] API 查询接口
- [ ] TUI 界面

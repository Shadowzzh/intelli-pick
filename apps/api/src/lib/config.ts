// apps/api/src/lib/config.ts
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export function loadConfig(path?: string): Config {
  // 查找配置文件路径
  const configPaths = path ? [path] : [
    resolve(process.cwd(), "config.yaml"),
    resolve(__dirname, "../../../../config.yaml"),
  ];

  let configPath: string | undefined;
  for (const p of configPaths) {
    if (existsSync(p)) {
      configPath = p;
      break;
    }
  }

  if (!configPath) {
    throw new Error(`Config file not found. Tried: ${configPaths.join(", ")}`);
  }

  const raw = readFileSync(configPath, "utf-8");
  const parsed = parse(raw);
  const replaced = replaceEnvVars(parsed);
  return ConfigSchema.parse(replaced);
}

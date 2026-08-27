// packages/config/src/schema.ts
import { z } from "zod";

// Twitter 配置
const TwitterConfigSchema = z.object({
	mode: z.enum(["home", "list", "user"]),
	listId: z.string().optional(),
	usernames: z.array(z.string()).optional(),
	maxResults: z.number().default(20),
});

// RSS 配置
const RssConfigSchema = z.object({
	url: z.string().url(),
	useProxy: z.boolean().default(true),
	fetchMethod: z.enum(["node", "curl"]).optional(),
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
	scheduleMinute: z.number().int().min(0).max(59).optional(),
	config: z.union([TwitterConfigSchema, RssConfigSchema, V2exConfigSchema]),
});

const JobSourceSchema = z.object({
	key: z.string().min(1),
	name: z.string().min(1),
	type: z.enum(["json-feed", "rss", "curl-rss"]),
	url: z.string().url(),
	enabled: z.boolean().default(true),
	fetchInterval: z
		.number()
		.int()
		.positive()
		.default(2 * 60 * 60),
});

const JobsConfigSchema = z.object({
	enabled: z.boolean().default(true),
	queueName: z.string().min(1).default("intellipick-jobs"),
	concurrency: z.number().int().positive().default(2),
	runInitialCollection: z.boolean().default(true),
	sources: z.array(JobSourceSchema).default([]),
});

// AI 任务配置
const AiTaskSchema = z.object({
	provider: z.string().min(1),
	model: z.string().min(1),
});

const AiProviderBaseSchema = z.object({
	baseUrl: z.string().url().optional(),
	baseUrlEnv: z.string().min(1).optional(),
	apiKeyEnv: z.string().min(1),
});

const OpenAiProviderSchema = AiProviderBaseSchema.extend({
	type: z.literal("openai"),
	protocol: z.enum(["chat-completions", "responses"]),
});

const AnthropicProviderSchema = AiProviderBaseSchema.extend({
	type: z.literal("anthropic"),
});

const AiProviderSchema = z.discriminatedUnion("type", [
	OpenAiProviderSchema,
	AnthropicProviderSchema,
]);

// AI 配置
const AiConfigSchema = z.object({
	providers: z.record(AiProviderSchema),
	tasks: z.object({
		filter: AiTaskSchema,
		extractAndClassify: AiTaskSchema,
		chat: AiTaskSchema.optional(),
	}),
});

// 硬规则配置
const HardRulesSchema = z.object({
	enabled: z.boolean().default(true),
	blacklistDomains: z.array(z.string()).default([]),
	spamKeywords: z.array(z.string()).default([]),
});

// 过滤阈值配置
const ThresholdsSchema = z.object({
	passMinValueScore: z.number().default(50),
	rejectMaxValueScore: z.number().default(29),
	quarantineOnSafety: z.boolean().default(true),
});

// 队列配置
const QueueConfigSchema = z.object({
	name: z.string().default("intellipick-pipeline"),
	concurrency: z.number().default(3),
	rateLimit: z.object({
		max: z.number().default(5),
		duration: z.number().default(1000),
	}),
	retry: z.object({
		attempts: z.number().default(3),
		backoff: z.object({
			type: z.enum(["exponential", "fixed"]).default("exponential"),
			delay: z.number().default(2000),
		}),
	}),
});

// API 配置
const ApiConfigSchema = z.object({
	corsOrigin: z.union([z.string(), z.array(z.string())]).default("*"),
	rateLimit: z.number().default(100),
	graphql: z.object({
		playground: z.boolean().default(false),
		introspection: z.boolean().default(true),
	}),
});

// 完整配置
export const ConfigSchema = z.object({
	ai: AiConfigSchema,
	sources: z.array(SourceSchema),
	filter: z.object({
		hardRules: HardRulesSchema,
		thresholds: ThresholdsSchema,
		promptVersion: z.string().default("v1.0"),
		quarantineTTLDays: z.number().default(30),
	}),
	scheduler: z.object({
		timezone: z.string().default("Asia/Shanghai"),
		lockTimeout: z.number().default(5 * 60 * 1000), // 5分钟，单位毫秒
	}),
	queue: QueueConfigSchema,
	jobs: JobsConfigSchema.optional(),
	api: ApiConfigSchema.optional(),
	network: z
		.object({
			httpProxy: z.string().url().optional(),
		})
		.optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type SourceConfig = z.infer<typeof SourceSchema>;
export type TwitterConfig = z.infer<typeof TwitterConfigSchema>;
export type RssConfig = z.infer<typeof RssConfigSchema>;
export type V2exConfig = z.infer<typeof V2exConfigSchema>;
export type AiConfig = z.infer<typeof AiConfigSchema>;
export type AiProviderConfig = z.infer<typeof AiProviderSchema>;
export type AiTaskName = keyof AiConfig["tasks"];
export type QueueConfig = z.infer<typeof QueueConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type JobsConfig = z.infer<typeof JobsConfigSchema>;
export type JobSourceConfig = z.infer<typeof JobSourceSchema>;

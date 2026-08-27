// config.ts - 用户配置文件
import { defineConfig } from "@intellipick/config";
import { sources } from "./config.sources";

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined) {
		return fallback;
	}
	return value === "true";
}

function parseCorsOrigin(value: string | undefined): string | string[] {
	if (!value || value === "*") {
		return "*";
	}

	const origins = value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	if (origins.length === 1) {
		return origins[0];
	}
	return origins;
}

const isProduction = process.env.NODE_ENV === "production";
const legacySub2ApiModel = process.env.SUB2API_MODEL;
const filterProvider = process.env.AI_FILTER_PROVIDER?.trim() || "codex";
const extractProvider =
	process.env.AI_EXTRACT_AND_CLASSIFY_PROVIDER?.trim() || "codex";

function resolveAiTaskModel(
	provider: string,
	explicitModel: string | undefined,
	codexModel: string,
): string {
	const model = explicitModel?.trim();
	if (model) {
		return model;
	}
	if (provider === "volcAgentPlan") {
		return "deepseek-v4-flash";
	}
	return codexModel;
}

const filterModel = resolveAiTaskModel(
	filterProvider,
	process.env.AI_FILTER_MODEL,
	process.env.SUB2API_FILTER_MODEL || legacySub2ApiModel || "gpt-5.6-luna",
);
const extractModel = resolveAiTaskModel(
	extractProvider,
	process.env.AI_EXTRACT_AND_CLASSIFY_MODEL,
	process.env.SUB2API_EXTRACT_AND_CLASSIFY_MODEL ||
		legacySub2ApiModel ||
		"gpt-5.6-terra",
);

export default defineConfig({
	ai: {
		providers: {
			codex: {
				type: "openai",
				protocol: "responses",
				baseUrl: "http://127.0.0.1:18090",
				baseUrlEnv: "SUB2API_BASE_URL",
				apiKeyEnv: "SUB2API_API_KEY",
			},
			deepseek: {
				type: "openai",
				protocol: "chat-completions",
				baseUrl: "https://api.deepseek.com/v1",
				baseUrlEnv: "DEEPSEEK_BASE_URL",
				apiKeyEnv: "DEEPSEEK_API_KEY",
			},
			volcAgentPlan: {
				type: "openai",
				protocol: "chat-completions",
				baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
				baseUrlEnv: "VOLC_AGENT_PLAN_BASE_URL",
				apiKeyEnv: "VOLC_AGENT_PLAN_API_KEY",
			},
			anthropic: {
				type: "anthropic",
				baseUrl: "https://open.bigmodel.cn/api/anthropic/v1",
				baseUrlEnv: "ANTHROPIC_BASE_URL",
				apiKeyEnv: "ANTHROPIC_API_KEY",
			},
		},
		tasks: {
			filter: {
				provider: filterProvider,
				model: filterModel,
			},
			extractAndClassify: {
				provider: extractProvider,
				model: extractModel,
			},
			chat: {
				provider: "codex",
				model:
					process.env.SUB2API_CHAT_MODEL ||
					legacySub2ApiModel ||
					"gpt-5.6-luna",
			},
		},
	},
	scheduler: {
		timezone: "Asia/Shanghai",
		lockTimeout: 5 * 60 * 1000, // 5分钟，单位毫秒
	},
	queue: {
		name: "intellipick-pipeline", // 队列名称
		concurrency: 5, // 同时处理
		rateLimit: {
			max: 10, // 每个时间窗口的最大任务数
			duration: 1000 * 10, // 时间窗口，单位毫秒
		},
		retry: {
			attempts: 0, // 失败重试
			backoff: {
				type: "exponential", // 指数退避
				delay: 2000, // 首次延迟
			},
		},
	},
	jobs: {
		enabled: true,
		queueName: "intellipick-jobs",
		concurrency: 2,
		runInitialCollection: true,
		sources: [
			{
				key: "v2ex-jobs",
				name: "V2EX 酷工作",
				type: "json-feed",
				url: "https://www.v2ex.com/feed/jobs.json",
				enabled: true,
				fetchInterval: 2 * 60 * 60,
			},
			{
				key: "linux-do-jobs",
				name: "LINUX DO 非我莫属",
				type: "curl-rss",
				url: "https://linux.do/c/job/27.rss",
				enabled: true,
				fetchInterval: 2 * 60 * 60,
			},
		],
	},
	api: {
		corsOrigin: parseCorsOrigin(process.env.API_CORS_ORIGIN),
		rateLimit: Number.parseInt(process.env.API_RATE_LIMIT || "100", 10),
		graphql: {
			playground: parseBoolean(process.env.GRAPHQL_PLAYGROUND, !isProduction),
			introspection: parseBoolean(
				process.env.GRAPHQL_INTROSPECTION,
				!isProduction,
			),
		},
	},
	sources,
	filter: {
		hardRules: {
			enabled: true, // 启用硬规则过滤
			blacklistDomains: ["bit.ly/spam"], // 黑名单域名
			spamKeywords: ["微信群", "返利", "优惠码", "开户", "代投", "包赚"], // 垃圾内容关键词
		},
		thresholds: {
			passMinValueScore: 50, // 达到此分数才允许通过
			rejectMaxValueScore: 29, // 不高于此分数可直接拒绝
			quarantineOnSafety: true, // 安全性低于阈值时隔离
		},
		promptVersion: "v2.0", // 使用的提示词版本
		quarantineTTLDays: 30, // 隔离内容保存天数
	},
});

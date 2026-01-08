// config.ts - 用户配置文件
import { defineConfig } from "@intellipick/config";
import { sources } from "./config.sources";

export default defineConfig({
	ai: {
		providers: {
			deepseek: {
				baseUrl: "https://api.deepseek.com/v1",
			},
			anthropic: {
				baseUrl: "https://open.bigmodel.cn/api/anthropic/v1",
			},
		},
		tasks: {
			filter: {
				provider: "deepseek",
				model: "deepseek-chat",
			},
			extractAndClassify: {
				provider: "deepseek",
				model: "deepseek-chat",
			},
		},
	},
	scheduler: {
		timezone: "Asia/Shanghai",
		lockTimeout: 5 * 60 * 1000, // 5分钟，单位毫秒
	},
	queue: {
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
	api: {
		corsOrigin: "*", // CORS 允许的源，"*" 表示允许所有，或使用数组 ["http://localhost:3000", "https://example.com"]
		rateLimit: 100, // API 速率限制（每分钟请求数）
		graphql: {
			playground: false, // 是否启用 GraphQL Playground
			introspection: true, // 是否启用 GraphQL 内省
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
			passMinValueScore: 50, // 及格分数线
			rejectMaxValueScore: 30, // 拒绝分数线
			quarantineOnSafety: true, // 安全性低于阈值时隔离
			rejectToQuarantineMinScore: 30, // 拒绝但保留观察的最低分数
		},
		promptVersion: "v1.0", // 使用的提示词版本
		quarantineTTLDays: 30, // 隔离内容保存天数
	},
});

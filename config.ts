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
		concurrency: 3, // 同时处理
		rateLimit: {
			max: 2, // 每秒最多
			duration: 1000 * 10, // 时间窗口
		},
		retry: {
			attempts: 0, // 失败重试
			backoff: {
				type: "exponential", // 指数退避
				delay: 2000, // 首次延迟
			},
		},
	},
	network: {
		httpProxy: "http://127.0.0.1:7890",
	},
	sources,
	filter: {
		hardRules: {
			enabled: true,
			blacklistDomains: ["bit.ly/spam"],
			spamKeywords: ["微信群", "返利", "优惠码", "开户", "代投", "包赚"],
		},
		thresholds: {
			passMinValueScore: 30,
			rejectMaxValueScore: 15,
			quarantineOnSafety: true,
		},
		promptVersion: "v1.0",
		quarantineTTLDays: 30,
	},
});

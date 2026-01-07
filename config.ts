// config.ts - 用户配置文件
import { defineConfig } from "@intellipick/config";

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
	sources: [
		{
			name: "Hacker News",
			type: "rss",
			enabled: false,
			fetchInterval: 3600, // 1 小时
			config: {
				url: "https://hnrss.org/frontpage",
			},
		},
		{
			name: "V2EX 热门",
			type: "v2ex",
			enabled: false,
			fetchInterval: 1800, // 30 分钟
			config: {
				node: "hot",
			},
		},
		{
			name: "Twitter 推荐",
			type: "twitter",
			enabled: true,
			fetchInterval: 1800, // 30 分钟
			config: {
				mode: "home",
				maxResults: 10,
			},
		},
	],
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
	scheduler: {
		timezone: "Asia/Shanghai",
		lockTimeout: 5 * 60 * 1000, // 5分钟，单位毫秒
	},
	queue: {
		concurrency: 1, // 同时处理
		rateLimit: {
			max: 1, // 每秒最多
			duration: 1000 * 100, // 时间窗口
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
});

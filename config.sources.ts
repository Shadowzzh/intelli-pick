// config.sources.ts - 数据源配置文件
import type { SourceConfig } from "@intellipick/config";

export const sources: SourceConfig[] = [
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
		enabled: false,
		fetchInterval: 1800, // 30 分钟
		config: {
			mode: "home",
			maxResults: 10,
		},
	},
	{
		name: "少数派首页",
		type: "rss",
		enabled: true,
		fetchInterval: 3600, // 1 小时
		config: {
			url: "http://localhost:1200/sspai/index", // 使用本地 RSSHub
		},
	},
	{
		name: "36氪热榜",
		type: "rss",
		enabled: true,
		fetchInterval: 1800, // 30 分钟（热榜更新较快）
		config: {
			url: "https://36kr.com/feed", // 使用官方 RSS
		},
	},
];

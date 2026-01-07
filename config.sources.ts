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
		enabled: true,
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
];

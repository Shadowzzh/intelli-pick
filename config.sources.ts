// config.sources.ts - 数据源配置文件
import type { SourceConfig } from "@intellipick/config";

export const sources: SourceConfig[] = [
	{
		name: "Hacker News",
		type: "rss",
		enabled: false,
		fetchInterval: 1800, // 1 小时
		config: {
			url: "https://hnrss.org/frontpage",
		},
	},
	{
		name: "V2EX 热门",
		type: "v2ex",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			node: "hot",
		},
	},
	// 废弃了 免费计划 一个月 100 个帖子的额度，pro 计划要 200$
	// {
	// 	name: "Twitter 推荐",
	// 	type: "twitter",
	// 	enabled: true,
	// 	fetchInterval: 20 * 60, // 20 分钟
	// 	config: {
	// 		mode: "home",
	// 		maxResults: 10,
	// 	},
	// },
	{
		name: "少数派首页",
		type: "rss",
		enabled: true,
		fetchInterval: 30 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/sspai/index", // 使用本地 RSSHub
		},
	},
	{
		name: "知乎热榜",
		type: "rss",
		enabled: true,
		fetchInterval: 30 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/zhihu/hot", // 使用本地 RSSHub
		},
	},
	{
		name: "readhub早报",
		type: "rss",
		enabled: true,
		fetchInterval: 4 * 60 * 60, // 2 小时
		config: {
			url: "http://localhost:1200/readhub/daily", // 使用本地 RSSHub
		},
	},
	{
		name: "澎湃首页",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/thepaper/featured", // 使用本地 RSSHub
		},
	},
	{
		name: "infoQ",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/infoq/recommend", // 使用本地 RSSHub
		},
	},
	{
		name: "月球背面",
		type: "rss",
		enabled: true,
		fetchInterval: 2 * 60 * 60, // 20 分钟
		config: {
			url: "https://moonvy.com/blog/rss.xml", // 使用本地 RSSHub
		},
	},
	{
		name: "一觉醒来发生了什么 - 即刻圈子",
		type: "rss",
		enabled: true,
		fetchInterval: 4 * 60 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/jike/topic/553870e8e4b0cafb0a1bef68", // 使用本地 RSSHub
		},
	},
	{
		name: "极客公园",
		type: "rss",
		enabled: true,
		fetchInterval: 30 * 60, // 20 分钟
		config: {
			url: "https://www.geekpark.net/rss", // 使用本地 RSSHub
		},
	},
	{
		name: "github 趋势",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/trending/daily/any", // 使用本地 RSSHub
		},
	},
	{
		name: "36氪热榜",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			url: "https://36kr.com/feed", // 使用官方 RSS
		},
	},
];

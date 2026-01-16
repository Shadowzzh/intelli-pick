// config.sources.ts - 数据源配置文件
import type { SourceConfig } from "@intellipick/config";

export const sources: SourceConfig[] = [
	{
		name: "Hacker News",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 1 小时
		config: {
			url: "http://localhost:1200/hackernews/threads/comments_list/dang", // 使用本地 RSSHub
		},
	},
	{
		name: "LINUX DO 快讯",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 1 小时
		config: {
			url: "https://linux.do/c/news/34.rss",
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
		fetchInterval: 1 * 60 * 60, // 1 小时
		config: {
			url: "http://localhost:1200/readhub/daily", // 使用本地 RSSHub
		},
	},
	// {
	// 	name: "澎湃首页",
	// 	type: "rss",
	// 	enabled: true,
	// 	fetchInterval: 20 * 60, // 20 分钟
	// 	config: {
	// 		url: "http://localhost:1200/thepaper/featured", // 使用本地 RSSHub
	// 	},
	// },
	{
		name: "infoQ",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/infoq/recommend", // 使用本地 RSSHub
		},
	},
	// {
	// 	name: "一觉醒来发生了什么 - 即刻圈子",
	// 	type: "rss",
	// 	enabled: true,
	// 	fetchInterval: 4 * 60 * 60, // 20 分钟
	// 	config: {
	// 		url: "http://localhost:1200/jike/topic/553870e8e4b0cafb0a1bef68", // 使用本地 RSSHub
	// 	},
	// },
	{
		name: "极客公园",
		type: "rss",
		enabled: false, // 禁用原因：网站存在 TLS/SSL 连接问题（Client network socket disconnected before secure TLS connection was established）
		fetchInterval: 30 * 60, // 30 分钟
		config: {
			url: "http://localhost:1200/geekpark", // 使用 RSSHub 路由（但源站仍有 TLS 问题）
			// 原始 RSS: url: "https://www.geekpark.net/rss", // 无法访问：TLS 错误
		},
	},
	{
		name: "github 趋势",
		type: "rss",
		enabled: true,
		fetchInterval: 20 * 60, // 20 分钟
		config: {
			url: "http://localhost:1200/github/trending/daily/any", // 使用本地 RSSHub
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

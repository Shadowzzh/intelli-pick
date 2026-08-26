// config.sources.ts - 数据源配置文件
import type { SourceConfig } from "@intellipick/config";

const RSSHUB_BASE_URL = process.env.RSSHUB_BASE_URL || "http://localhost:1200";

function createRssHubUrl(path: string): string {
	const baseUrl = `${RSSHUB_BASE_URL.replace(/\/+$/, "")}/`;
	return new URL(path.replace(/^\/+/, ""), baseUrl).toString();
}

// 数据源名称
const NAMES = {
	HACKER_NEWS: "Hacker News",
	LINUX_DO: "LINUX DO 快讯",
	LINUX_DO_HOT: "LINUX DO 热门",
	V2EX_HOT: "V2EX 热门",
	SSPAI: "少数派首页",
	ZHIHU_HOT: "知乎热榜",
	READHUB_DAILY: "readhub早报",
	INFOQ: "infoQ",
	GEEKPARK: "极客公园",
	GITHUB_TRENDING: "github 趋势",
	KR_36: "36氪热榜",
} as const;

// 采集间隔配置（单位：秒）
const HACKER_NEWS_INTERVAL = 2 * 60 * 60; // Hacker News - 2 小时
const LINUX_DO_INTERVAL = 2 * 60 * 60; // LINUX DO 快讯 - 2 小时
const LINUX_DO_HOT_INTERVAL = 2 * 60 * 60; // LINUX DO 热门 - 2 小时
const V2EX_HOT_INTERVAL = 2 * 60 * 60; // V2EX 热门 - 2 小时
const SSPAI_INTERVAL = 2 * 60 * 60; // 少数派首页 - 2 小时
const ZHIHU_HOT_INTERVAL = 2 * 60 * 60; // 知乎热榜 - 2 小时
const READHUB_DAILY_INTERVAL = 2 * 60 * 60; // readhub早报 - 2 小时
const INFOQ_INTERVAL = 2 * 60 * 60; // infoQ - 2 小时
const GEEKPARK_INTERVAL = 2 * 60 * 60; // 极客公园 - 2 小时
const GITHUB_TRENDING_INTERVAL = 2 * 60 * 60; // github 趋势 - 2 小时
const KR_36_INTERVAL = 4 * 60 * 60; // 36氪热榜 - 4 小时
const BLOCK_BEATS_INTERVAL = 2 * 60 * 60; // Block Beats - 2 小时

export const sources: SourceConfig[] = [
	{
		name: "Block Beats",
		type: "rss",
		enabled: true,
		fetchInterval: BLOCK_BEATS_INTERVAL,
		config: {
			url: createRssHubUrl("theblockbeats/newsflash"),
			useProxy: false,
		},
	},
	{
		name: NAMES.HACKER_NEWS,
		type: "rss",
		enabled: true,
		fetchInterval: HACKER_NEWS_INTERVAL,
		config: {
			url: createRssHubUrl("hackernews/threads/comments_list/dang"),
			useProxy: false,
		},
	},
	{
		name: NAMES.LINUX_DO,
		type: "rss",
		enabled: false, // 官方 RSS 在 Node 客户端下持续返回 403，待更换可用入口后恢复。
		fetchInterval: LINUX_DO_INTERVAL,
		config: {
			url: "https://linux.do/c/news/34.rss",
			useProxy: true,
		},
	},
	{
		name: NAMES.LINUX_DO_HOT,
		type: "rss",
		enabled: true,
		fetchInterval: LINUX_DO_HOT_INTERVAL,
		scheduleMinute: 15,
		config: {
			url: "https://linux.do/hot.rss",
			useProxy: false,
			fetchMethod: "curl",
		},
	},
	{
		name: NAMES.V2EX_HOT,
		type: "v2ex",
		enabled: true,
		fetchInterval: V2EX_HOT_INTERVAL,
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
		name: NAMES.SSPAI,
		type: "rss",
		enabled: true,
		fetchInterval: SSPAI_INTERVAL,
		config: {
			url: createRssHubUrl("sspai/index"),
			useProxy: false,
		},
	},
	{
		name: NAMES.ZHIHU_HOT,
		type: "rss",
		enabled: true,
		fetchInterval: ZHIHU_HOT_INTERVAL,
		config: {
			url: createRssHubUrl("zhihu/hot"),
			useProxy: false,
		},
	},
	{
		name: NAMES.READHUB_DAILY,
		type: "rss",
		enabled: true,
		fetchInterval: READHUB_DAILY_INTERVAL,
		config: {
			url: createRssHubUrl("readhub/daily"),
			useProxy: false,
		},
	},
	{
		name: NAMES.INFOQ,
		type: "rss",
		enabled: true,
		fetchInterval: INFOQ_INTERVAL,
		config: {
			url: createRssHubUrl("infoq/recommend"),
			useProxy: false,
		},
	},
	{
		name: NAMES.GEEKPARK,
		type: "rss",
		enabled: true, // 禁用原因：网站存在 TLS/SSL 连接问题（Client network socket disconnected before secure TLS connection was established）
		fetchInterval: GEEKPARK_INTERVAL,
		config: {
			url: createRssHubUrl("geekpark"),
			useProxy: false,
		},
	},
	{
		name: NAMES.GITHUB_TRENDING,
		type: "rss",
		enabled: true,
		fetchInterval: GITHUB_TRENDING_INTERVAL,
		config: {
			url: createRssHubUrl("github/trending/daily/any"),
			useProxy: false,
		},
	},
	{
		name: NAMES.KR_36,
		type: "rss",
		enabled: true,
		fetchInterval: KR_36_INTERVAL,
		config: {
			url: createRssHubUrl("36kr/newsflashes"),
			useProxy: false,
		},
	},
];

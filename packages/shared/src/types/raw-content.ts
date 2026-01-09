// packages/shared/src/types/raw-content.ts

/**
 * 所有 Collector 插件的统一输出格式
 */
export interface RawContent {
	// 来源标识
	sourceType: string; // "twitter" | "rss" | "v2ex"
	sourceId: string; // 配置中的 source id
	externalId: string; // 原平台的唯一 ID

	// 内容
	title: string | null; // 标题（Twitter 可能没有）
	content: string; // 正文/推文内容
	url: string; // 原文链接
	author: string | null; // 作者

	// 时间
	publishedAt: string | null; // 发布时间（UTC ISO 8601 格式）
	collectedAt: string; // 采集时间（UTC ISO 8601 格式）

	// 原始数据（可选，调试用）
	raw?: unknown;
}

// packages/db/src/schema/contents.ts
/**
 * 内容表
 *
 * 用于存储通过所有过滤步骤的有价值内容。
 * 这些内容已经通过去重、硬规则过滤、AI 质量评分和实体提取等完整流程。
 */
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { sources } from "./sources";

export const contents = pgTable(
	"contents",
	{
		/** 主键，使用 nanoid 生成的唯一标识符 */
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),

		// ========== 来源信息 ==========

		/** 关联的数据源 ID，外键指向 sources 表 */
		sourceId: text("source_id").references(() => sources.id),

		/** 外部系统中的内容 ID
		 * - RSS: guid 或 link
		 * - Twitter: tweet ID
		 * - V2EX: topic ID
		 */
		externalId: text("external_id"),

		/** 内容的原始 URL 链接 */
		url: text("url"),

		/** 作者名称
		 * - RSS: 作者字段
		 * - Twitter: @username
		 * - V2EX: 用户名
		 */
		author: text("author"),

		// ========== 原始内容 ==========

		/** 原始文本内容
		 * PostgreSQL TOAST 机制会自动压缩大文本
		 * 保留原文用于后续可能的重新分析或审计
		 */
		rawContent: text("raw_content").notNull(),

		// ========== AI 提取的结构化信息 ==========

		/** 由 AI 提取的内容标题（可能不同于原始标题） */
		title: text("title"),

		/** 由 AI 生成的内容摘要，提炼核心观点 */
		summary: text("summary"),

		/** 由 AI 提取的关键要点列表
		 * 每个要点是内容中的重要观点或信息
		 */
		keyPoints: jsonb("key_points").$type<string[]>(),

		/** 由 AI 提取的数据点列表
		 * 包含内容中的具体数据、统计、数字等
		 */
		dataPoints: jsonb("data_points").$type<string[]>(),

		/** 内容类型分类
		 * - single: 单一主题的独立内容
		 * - aggregation: 汇总多篇内容的合集
		 */
		contentType: text("content_type"),

		// ========== AI 分类结果 ==========

		/** 由 AI 判定的一级分类
		 * 例如: 技术、产品、行业动态、观点评论等
		 */
		category: text("category"),

		/** 由 AI 提取的标签列表
		 * 多维度的分类标签，便于检索和聚合
		 */
		tags: jsonb("tags").$type<string[]>(),

		// ========== 过滤结果（用于回放和审计）==========

		/** 过滤规则版本号
		 * 记录内容通过的是哪个版本的过滤规则
		 */
		filterVersion: text("filter_version"),

		/** 完整的过滤结果
		 * 包含 AI 评分、决策原因、信号等详细信息
		 * 用于审计和优化过滤规则
		 */
		filterResult: jsonb("filter_result"),

		// ========== 时间信息 ==========

		/** 内容在原始平台的发布时间 */
		publishedAt: timestamp("published_at"),

		/** 内容被采集到系统的时间 */
		collectedAt: timestamp("collected_at").defaultNow(),

		/** 内容通过所有过滤步骤并存储到数据库的时间 */
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		// Indexes for performance optimization
		publishedAtIdx: index("idx_contents_published_at").on(table.publishedAt),
		categoryIdx: index("idx_contents_category").on(table.category),
		sourceIdIdx: index("idx_contents_source_id").on(table.sourceId),
	}),
);

export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;

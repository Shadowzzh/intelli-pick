// packages/db/src/schema/quarantine.ts
/**
 * 隔离区表
 *
 * 用于存储未通过过滤但值得保留观察的内容。
 *
 * 决策类型：
 * - reject: 明确拒绝的内容（低价值、垃圾内容等）
 * - quarantine: 隔离观察的内容（边界情况、可能有价值但不确定）
 *
 * 隔离区内容有 TTL（过期时间），过期后自动删除。
 * 此表用于：
 * 1. 审计和调试过滤规则
 * 2. 分析假阳性（错误过滤的有价值内容）
 * 3. 优化 AI 评分标准
 */
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { sources } from "./sources";

export const quarantine = pgTable("quarantine", {
	/** 主键，使用 nanoid 生成的唯一标识符 */
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),

	// ========== 来源信息 ==========

	/** 关联的数据源 ID，外键指向 sources 表 */
	sourceId: text("source_id").references(() => sources.id),

	/** 外部系统中的内容 ID */
	externalId: text("external_id"),

	/** 内容的原始 URL 链接 */
	url: text("url"),

	/** 作者名称 */
	author: text("author"),

	// ========== 原始内容 ==========

	/** 原始文本内容
	 * 保留原文用于后续可能的重新评估
	 */
	rawContent: text("raw_content").notNull(),

	// ========== 过滤结果 ==========

	/** 过滤规则版本号
	 * 记录内容被哪个版本的规则过滤
	 */
	filterVersion: text("filter_version"),

	/** 过滤决策
	 * - reject: 明确拒绝（垃圾内容、低价值等）
	 * - quarantine: 隔离观察（边界情况、不确定）
	 */
	decision: text("decision").notNull(),

	/** AI 价值评分 (0-100)
	 * 内容的价值得分，低于阈值被过滤
	 */
	valueScore: integer("value_score"),

	/** AI 噪音评分 (0-100)
	 * 内容的噪音程度，高于阈值被过滤
	 */
	noiseScore: integer("noise_score"),

	/** 安全检查结果
	 * JSON 格式，包含安全性评估的详细信息
	 * 例如: { safe: true, reasons: [] }
	 */
	safety: jsonb("safety"),

	/** 过滤原因列表
	 * 记录为什么内容被过滤
	 * 例如: ["value score too low", "too much noise"]
	 */
	reasons: jsonb("reasons").$type<string[]>(),

	/** 检测到的信号列表
	 * 记录内容中出现的特征信号
	 * 例如: ["has_links", "technical_terms", "code_snippets"]
	 */
	signals: jsonb("signals").$type<string[]>(),

	/** 一句话总结为什么被过滤
	 * 由 AI 生成的简洁说明
	 */
	oneLineWhy: text("one_line_why"),

	// ========== 生命周期 ==========

	/** 内容被过滤并放入隔离区的时间 */
	createdAt: timestamp("created_at").defaultNow(),

	/** 过期时间
	 * TTL 之后的记录会被自动清理
	 * 默认保留一段时间用于审计和调试
	 */
	expiresAt: timestamp("expires_at"),
});

export type Quarantine = typeof quarantine.$inferSelect;
export type NewQuarantine = typeof quarantine.$inferInsert;

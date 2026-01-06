// packages/db/src/schema/contents.ts
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { sources } from "./sources";

export const contents = pgTable("contents", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),

	// 来源
	sourceId: text("source_id").references(() => sources.id),
	externalId: text("external_id"),
	url: text("url"),
	author: text("author"),

	// 原始内容（PostgreSQL TOAST 自动压缩）
	rawContent: text("raw_content").notNull(),

	// AI 提取的结构化信息
	title: text("title"),
	summary: text("summary"),
	keyPoints: jsonb("key_points").$type<string[]>(),
	dataPoints: jsonb("data_points").$type<string[]>(),
	contentType: text("content_type"), // single | aggregation

	// AI 分类结果
	category: text("category"),
	tags: jsonb("tags").$type<string[]>(),

	// 过滤结果（用于回放）
	filterVersion: text("filter_version"),
	filterResult: jsonb("filter_result"),

	// 时间
	publishedAt: timestamp("published_at"),
	collectedAt: timestamp("collected_at").defaultNow(),
	createdAt: timestamp("created_at").defaultNow(),
});

export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;

// packages/db/src/schema/tags.ts
/**
 * 标签表
 *
 * 用于管理系统中的标签定义和分类。
 * 标签用于对内容进行多维度分类，提供灵活的检索和聚合能力。
 * 注意：当前版本中，标签主要作为内容元数据存储，
 * 此表预留用于未来的标签规范化和统计功能。
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const tags = pgTable("tags", {
	/** 主键，使用 nanoid 生成的唯一标识符 */
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),

	/** 标签名称，全局唯一
	 * 例如: "React", "AI", "性能优化"
	 */
	name: text("name").notNull().unique(),

	/** 标签所属的大类或分类
	 * 用于将相关标签分组
	 * 例如: "技术栈", "主题", "行业"
	 */
	category: text("category"),

	/** 标签描述
	 * 说明标签的含义和适用范围
	 */
	description: text("description"),

	/** 标签创建时间 */
	createdAt: timestamp("created_at").defaultNow(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

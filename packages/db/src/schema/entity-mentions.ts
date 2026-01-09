// packages/db/src/schema/entity-mentions.ts
/**
 * 实体提及关联表
 *
 * 用于建立实体与内容之间的多对多关系。
 * 每条记录表示某个实体在某篇内容中被提及了一次。
 * 这个设计支持：
 * 1. 查询某个实体在哪些内容中被提及
 * 2. 查询某篇内容提到了哪些实体
 * 3. 统计实体的提及次数和时间趋势
 */
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { contents } from "./contents";
import { entities } from "./entities";
import { sources } from "./sources";

export const entityMentions = pgTable(
	"entity_mentions",
	{
		/** 主键，使用 nanoid 生成的唯一标识符 */
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),

		/** 关联的实体 ID，外键指向 entities 表 */
		entityId: text("entity_id").references(() => entities.id),

		/** 关联的内容 ID，外键指向 contents 表 */
		contentId: text("content_id").references(() => contents.id),

		/** 关联的数据源 ID，外键指向 sources 表
		 * 便于快速查询某个数据源中提到了哪些实体
		 */
		sourceId: text("source_id").references(() => sources.id),

		/** 提及的上下文片段
		 * 包含实体在内容中被提及的具体句子或段落
		 * 用于展示实体在什么语境下被讨论
		 */
		context: text("context"),

		/** 提及发生的时间
		 * 通常使用内容的发布时间或采集时间
		 */
		mentionedAt: timestamp("mentioned_at").defaultNow(),
	},
	(table) => ({
		// Indexes for performance optimization
		entityIdIdx: index("idx_entity_mentions_entity_id").on(table.entityId),
		contentIdIdx: index("idx_entity_mentions_content_id").on(table.contentId),
	}),
);

export type EntityMention = typeof entityMentions.$inferSelect;
export type NewEntityMention = typeof entityMentions.$inferInsert;

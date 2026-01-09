// packages/db/src/schema/entities.ts
/**
 * 实体表
 *
 * 用于存储从内容中提取的实体信息。
 * 实体可以是人、公司、产品、工具、库、文章等。
 * 系统会自动聚合同一实体的多次提及，统计其热度趋势。
 */
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const entities = pgTable(
	"entities",
	{
		/** 主键，使用 nanoid 生成的唯一标识符 */
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),

		/** 实体名称
		 * - 工具/库: 项目名称
		 * - 公司/组织: 全名
		 * - 人物: 全名
		 */
		name: text("name").notNull(),

		/** 实体类型分类
		 * - tool: 实用工具（如 CLI 工具、在线服务）
		 * - project: 开源项目或产品
		 * - library: 技术库或框架
		 * - article: 文章或博客
		 * - person: 人物（开发者、创作者、企业家等）
		 * - company: 公司或组织
		 */
		type: text("type").notNull(),

		/** 实体的官方链接或主页 URL */
		url: text("url"),

		/** 实体描述
		 * 由 AI 提取的简短描述，说明实体是什么或做什么
		 */
		description: text("description"),

		// ========== 统计信息 ==========

		/** 被提及的次数
		 * 每次在内容中出现此实体时递增
		 * 用于评估实体热度和影响力
		 */
		mentionCount: integer("mention_count").default(1),

		/** 首次被提及的时间
		 * 用于追踪实体首次出现的时机
		 */
		firstMentionedAt: timestamp("first_mentioned_at"),

		/** 最后一次被提及的时间
		 * 用于判断实体是否仍在活跃讨论中
		 */
		lastMentionedAt: timestamp("last_mentioned_at"),

		/** 额外的元数据信息
		 * JSON 格式，可存储实体的附加属性
		 * 例如: GitHub stars、版本号、作者等
		 */
		metadata: jsonb("metadata"),

		/** 实体首次被提取并创建的时间 */
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		// Indexes for performance optimization
		mentionCountIdx: index("idx_entities_mention_count").on(table.mentionCount),
		lastMentionedAtIdx: index("idx_entities_last_mentioned_at").on(
			table.lastMentionedAt,
		),
	}),
);

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

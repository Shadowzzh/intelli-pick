// packages/db/src/schema/sources.ts
/**
 * 数据源表
 *
 * 用于存储系统中所有内容采集源的配置信息。
 * 每个数据源代表一个可以抓取内容的外部系统（如 RSS 订阅源、Twitter 账号、V2EX 节点等）。
 */
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const sources = pgTable("sources", {
	/** 主键，使用 nanoid 生成的唯一标识符 */
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),

	/** 数据源名称，便于识别和管理 */
	name: text("name").notNull(),

	/** 数据源类型，决定使用哪个采集插件
	 * - twitter: Twitter/X 账号或搜索
	 * - rss: RSS/Atom 订阅源
	 * - v2ex: V2EX 社区节点
	 */
	type: text("type").notNull(),

	/** 类型相关的配置信息，JSON 格式存储
	 * - RSS: { url: string }
	 * - Twitter: { username: string, contentType: 'tweets' | 'likes' }
	 * - V2EX: { node: string }
	 */
	config: jsonb("config").notNull(),

	/** 是否启用该数据源。禁用的数据源不会被采集 */
	enabled: boolean("enabled").default(true),

	/** 采集间隔时间（秒），默认 3600 秒（1 小时） */
	fetchInterval: integer("fetch_interval").default(3600),

	/** 上次成功采集的时间（存储为 UTC），用于调度器判断是否需要再次采集 */
	lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),

	/** 创建时间，数据源首次添加到系统的时间（存储为 UTC） */
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

	/** 更新时间，配置最后修改的时间（存储为 UTC） */
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

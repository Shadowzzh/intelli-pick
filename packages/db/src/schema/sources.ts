// packages/db/src/schema/sources.ts
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
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	type: text("type").notNull(), // twitter | rss | v2ex
	config: jsonb("config").notNull(), // 类型相关配置
	enabled: boolean("enabled").default(true),
	fetchInterval: integer("fetch_interval").default(3600),
	lastFetchedAt: timestamp("last_fetched_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

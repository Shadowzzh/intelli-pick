// packages/db/src/schema/entities.ts
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const entities = pgTable("entities", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	type: text("type").notNull(), // tool | project | library | article | person | company
	url: text("url"),
	description: text("description"),

	// 统计
	mentionCount: integer("mention_count").default(1),
	firstMentionedAt: timestamp("first_mentioned_at"),
	lastMentionedAt: timestamp("last_mentioned_at"),

	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

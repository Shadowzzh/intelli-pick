// packages/db/src/schema/tags.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const tags = pgTable("tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull().unique(),
	category: text("category"), // 大类
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

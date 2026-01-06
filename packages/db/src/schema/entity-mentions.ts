// packages/db/src/schema/entity-mentions.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { entities } from "./entities.js";
import { contents } from "./contents.js";
import { sources } from "./sources.js";

export const entityMentions = pgTable("entity_mentions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  entityId: text("entity_id").references(() => entities.id),
  contentId: text("content_id").references(() => contents.id),
  sourceId: text("source_id").references(() => sources.id),
  context: text("context"),
  mentionedAt: timestamp("mentioned_at").defaultNow(),
});

export type EntityMention = typeof entityMentions.$inferSelect;
export type NewEntityMention = typeof entityMentions.$inferInsert;

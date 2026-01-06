// packages/db/src/schema/quarantine.ts
import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { sources } from "./sources.js";

export const quarantine = pgTable("quarantine", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),

  // 来源
  sourceId: text("source_id").references(() => sources.id),
  externalId: text("external_id"),
  url: text("url"),
  author: text("author"),

  // 原始内容
  rawContent: text("raw_content").notNull(),

  // 过滤结果
  filterVersion: text("filter_version"),
  decision: text("decision").notNull(),           // reject | quarantine
  valueScore: integer("value_score"),
  noiseScore: integer("noise_score"),
  safety: jsonb("safety"),
  reasons: jsonb("reasons").$type<string[]>(),
  signals: jsonb("signals").$type<string[]>(),
  oneLineWhy: text("one_line_why"),

  // 生命周期
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type Quarantine = typeof quarantine.$inferSelect;
export type NewQuarantine = typeof quarantine.$inferInsert;

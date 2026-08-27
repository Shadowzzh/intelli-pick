import {
	boolean,
	doublePrecision,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { contents } from "./contents";

export const contentDuplicateCandidates = pgTable(
	"content_duplicate_candidates",
	{
		id: serial("id").primaryKey(),
		leftContentId: text("left_content_id")
			.notNull()
			.references(() => contents.id, { onDelete: "cascade" }),
		rightContentId: text("right_content_id")
			.notNull()
			.references(() => contents.id, { onDelete: "cascade" }),
		classification: text("classification").notNull(),
		reason: text("reason").notNull(),
		similarity: doublePrecision("similarity").notNull(),
		editSimilarity: doublePrecision("edit_similarity").notNull(),
		simhashDistance: integer("simhash_distance").notNull(),
		lengthRatio: doublePrecision("length_ratio").notNull(),
		keyTokensMatch: boolean("key_tokens_match").notNull(),
		timeDistanceHours: doublePrecision("time_distance_hours"),
		status: text("status").notNull().default("pending"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		pairUnique: uniqueIndex("content_duplicate_candidates_pair_unique").on(
			table.leftContentId,
			table.rightContentId,
		),
		leftContentIdx: index("content_duplicate_candidates_left_idx").on(
			table.leftContentId,
		),
		rightContentIdx: index("content_duplicate_candidates_right_idx").on(
			table.rightContentId,
		),
		statusIdx: index("content_duplicate_candidates_status_idx").on(
			table.status,
		),
	}),
);

export type ContentDuplicateCandidate =
	typeof contentDuplicateCandidates.$inferSelect;
export type NewContentDuplicateCandidate =
	typeof contentDuplicateCandidates.$inferInsert;

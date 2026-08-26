import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const jobSources = pgTable(
	"job_sources",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		key: text("key").notNull(),
		name: text("name").notNull(),
		type: text("type").notNull(),
		url: text("url").notNull(),
		enabled: boolean("enabled").notNull().default(true),
		fetchInterval: integer("fetch_interval").notNull().default(7200),
		lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
		lastFetchStatus: text("last_fetch_status"),
		lastFetchError: text("last_fetch_error"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		keyUnique: uniqueIndex("job_sources_key_unique").on(table.key),
	}),
);

export const jobPostings = pgTable(
	"job_postings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		sourceId: text("source_id")
			.notNull()
			.references(() => jobSources.id, { onDelete: "cascade" }),
		externalId: text("external_id").notNull(),
		url: text("url").notNull(),
		title: text("title").notNull(),
		company: text("company"),
		roleCategories: jsonb("role_categories")
			.$type<string[]>()
			.notNull()
			.default([]),
		locations: jsonb("locations").$type<string[]>().notNull().default([]),
		remoteType: text("remote_type").notNull().default("unknown"),
		employmentType: text("employment_type"),
		salaryText: text("salary_text"),
		experience: text("experience"),
		skills: jsonb("skills").$type<string[]>().notNull().default([]),
		summary: text("summary").notNull(),
		requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
		benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
		application: text("application"),
		rawContent: text("raw_content").notNull(),
		rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
		status: text("status").notNull().default("active"),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		collectedAt: timestamp("collected_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		sourceExternalUnique: uniqueIndex("job_postings_source_external_unique").on(
			table.sourceId,
			table.externalId,
		),
		urlIdx: index("job_postings_url_idx").on(table.url),
		publishedAtIdx: index("job_postings_published_at_idx").on(
			table.publishedAt,
		),
		statusIdx: index("job_postings_status_idx").on(table.status),
		remoteTypeIdx: index("job_postings_remote_type_idx").on(table.remoteType),
		roleCategoriesIdx: index("job_postings_role_categories_idx").using(
			"gin",
			table.roleCategories,
		),
	}),
);

export const jobTracking = pgTable(
	"job_tracking",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		postingId: text("posting_id")
			.notNull()
			.references(() => jobPostings.id, { onDelete: "cascade" }),
		isFavorite: boolean("is_favorite").notNull().default(false),
		status: text("status").notNull().default("new"),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		postingUnique: uniqueIndex("job_tracking_posting_unique").on(
			table.postingId,
		),
		statusIdx: index("job_tracking_status_idx").on(table.status),
	}),
);

export type JobSource = typeof jobSources.$inferSelect;
export type NewJobSource = typeof jobSources.$inferInsert;
export type JobPosting = typeof jobPostings.$inferSelect;
export type NewJobPosting = typeof jobPostings.$inferInsert;
export type JobTracking = typeof jobTracking.$inferSelect;
export type NewJobTracking = typeof jobTracking.$inferInsert;

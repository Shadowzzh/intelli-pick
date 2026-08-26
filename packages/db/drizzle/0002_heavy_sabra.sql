-- Step 1: Convert column types to timestamp with time zone
ALTER TABLE "sources" ALTER COLUMN "last_fetched_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "published_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "collected_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "first_mentioned_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "last_mentioned_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entity_mentions" ALTER COLUMN "mentioned_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quarantine" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quarantine" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;

-- Step 2: Convert existing data from local time (Asia/Shanghai, GMT+8) to UTC
-- All existing timestamps are stored as local time, so we subtract 8 hours to convert to UTC

-- Convert sources table
UPDATE "sources" SET "last_fetched_at" = "last_fetched_at" - INTERVAL '8 hours' WHERE "last_fetched_at" IS NOT NULL;--> statement-breakpoint
UPDATE "sources" SET "created_at" = "created_at" - INTERVAL '8 hours';--> statement-breakpoint
UPDATE "sources" SET "updated_at" = "updated_at" - INTERVAL '8 hours';--> statement-breakpoint

-- Convert contents table
UPDATE "contents" SET "published_at" = "published_at" - INTERVAL '8 hours' WHERE "published_at" IS NOT NULL;--> statement-breakpoint
UPDATE "contents" SET "collected_at" = "collected_at" - INTERVAL '8 hours';--> statement-breakpoint
UPDATE "contents" SET "created_at" = "created_at" - INTERVAL '8 hours';--> statement-breakpoint

-- Convert entities table
UPDATE "entities" SET "first_mentioned_at" = "first_mentioned_at" - INTERVAL '8 hours' WHERE "first_mentioned_at" IS NOT NULL;--> statement-breakpoint
UPDATE "entities" SET "last_mentioned_at" = "last_mentioned_at" - INTERVAL '8 hours' WHERE "last_mentioned_at" IS NOT NULL;--> statement-breakpoint
UPDATE "entities" SET "created_at" = "created_at" - INTERVAL '8 hours';--> statement-breakpoint

-- Convert entity_mentions table
UPDATE "entity_mentions" SET "mentioned_at" = "mentioned_at" - INTERVAL '8 hours';--> statement-breakpoint

-- Convert tags table
UPDATE "tags" SET "created_at" = "created_at" - INTERVAL '8 hours';--> statement-breakpoint

-- Convert quarantine table
UPDATE "quarantine" SET "created_at" = "created_at" - INTERVAL '8 hours';--> statement-breakpoint
UPDATE "quarantine" SET "expires_at" = "expires_at" - INTERVAL '8 hours' WHERE "expires_at" IS NOT NULL;
ALTER TABLE "sources" ADD COLUMN "is_configured" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "schedule_minute" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "last_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "last_fetch_status" text DEFAULT 'never' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "last_fetch_error" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "last_item_count" integer;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "last_new_count" integer;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "last_duration_ms" integer;--> statement-breakpoint
UPDATE "sources" AS "source"
SET
	"last_attempted_at" = "latest"."collected_at",
	"last_fetched_at" = "latest"."collected_at",
	"last_fetch_status" = 'success'
FROM (
	SELECT "source_id", max("collected_at") AS "collected_at"
	FROM "contents"
	WHERE "source_id" IS NOT NULL
	GROUP BY "source_id"
) AS "latest"
WHERE
	"source"."id" = "latest"."source_id"
	AND "source"."last_fetched_at" IS NULL;

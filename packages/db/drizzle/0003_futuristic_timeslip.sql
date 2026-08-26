CREATE TABLE IF NOT EXISTS "job_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"job_name" text DEFAULT 'process' NOT NULL,
	"source_type" text,
	"url" text,
	"external_id" text,
	"status" text NOT NULL,
	"success" boolean,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone NOT NULL,
	"duration" integer,
	"failed_reason" text,
	"stacktrace" text,
	"return_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_history_job_id_idx" ON "job_history" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_history_status_idx" ON "job_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_history_finished_at_idx" ON "job_history" USING btree ("finished_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_history_source_type_idx" ON "job_history" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_history_created_at_idx" ON "job_history" USING btree ("created_at");

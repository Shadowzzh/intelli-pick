CREATE TABLE "job_postings" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"remote_type" text DEFAULT 'unknown' NOT NULL,
	"employment_type" text,
	"salary_text" text,
	"experience" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"application" text,
	"raw_content" text NOT NULL,
	"raw_data" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"published_at" timestamp with time zone,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"fetch_interval" integer DEFAULT 7200 NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_fetch_status" text,
	"last_fetch_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"posting_id" text NOT NULL,
	"status" text DEFAULT 'saved' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tracking" ADD CONSTRAINT "job_tracking_posting_id_job_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_postings_source_external_unique" ON "job_postings" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "job_postings_url_idx" ON "job_postings" USING btree ("url");--> statement-breakpoint
CREATE INDEX "job_postings_published_at_idx" ON "job_postings" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "job_postings_status_idx" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_postings_remote_type_idx" ON "job_postings" USING btree ("remote_type");--> statement-breakpoint
CREATE UNIQUE INDEX "job_sources_key_unique" ON "job_sources" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "job_tracking_posting_unique" ON "job_tracking" USING btree ("posting_id");--> statement-breakpoint
CREATE INDEX "job_tracking_status_idx" ON "job_tracking" USING btree ("status");
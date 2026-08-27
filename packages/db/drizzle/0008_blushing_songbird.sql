CREATE TABLE "content_duplicate_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"left_content_id" text NOT NULL,
	"right_content_id" text NOT NULL,
	"classification" text NOT NULL,
	"reason" text NOT NULL,
	"similarity" double precision NOT NULL,
	"edit_similarity" double precision NOT NULL,
	"simhash_distance" integer NOT NULL,
	"length_ratio" double precision NOT NULL,
	"key_tokens_match" boolean NOT NULL,
	"time_distance_hours" double precision,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_duplicate_candidates" ADD CONSTRAINT "content_duplicate_candidates_left_content_id_contents_id_fk" FOREIGN KEY ("left_content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_duplicate_candidates" ADD CONSTRAINT "content_duplicate_candidates_right_content_id_contents_id_fk" FOREIGN KEY ("right_content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_duplicate_candidates_pair_unique" ON "content_duplicate_candidates" USING btree ("left_content_id","right_content_id");--> statement-breakpoint
CREATE INDEX "content_duplicate_candidates_left_idx" ON "content_duplicate_candidates" USING btree ("left_content_id");--> statement-breakpoint
CREATE INDEX "content_duplicate_candidates_right_idx" ON "content_duplicate_candidates" USING btree ("right_content_id");--> statement-breakpoint
CREATE INDEX "content_duplicate_candidates_status_idx" ON "content_duplicate_candidates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_source_external_unique" ON "contents" USING btree ("source_id","external_id");
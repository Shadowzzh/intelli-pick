CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"enabled" boolean DEFAULT true,
	"fetch_interval" integer DEFAULT 3600,
	"last_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text,
	"external_id" text,
	"url" text,
	"author" text,
	"raw_content" text NOT NULL,
	"title" text,
	"summary" text,
	"key_points" jsonb,
	"data_points" jsonb,
	"content_type" text,
	"category" text,
	"tags" jsonb,
	"filter_version" text,
	"filter_result" jsonb,
	"published_at" timestamp,
	"collected_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"description" text,
	"mention_count" integer DEFAULT 1,
	"first_mentioned_at" timestamp,
	"last_mentioned_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entity_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text,
	"content_id" text,
	"source_id" text,
	"context" text,
	"mentioned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "quarantine" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text,
	"external_id" text,
	"url" text,
	"author" text,
	"raw_content" text NOT NULL,
	"filter_version" text,
	"decision" text NOT NULL,
	"value_score" integer,
	"noise_score" integer,
	"safety" jsonb,
	"reasons" jsonb,
	"signals" jsonb,
	"one_line_why" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantine" ADD CONSTRAINT "quarantine_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;
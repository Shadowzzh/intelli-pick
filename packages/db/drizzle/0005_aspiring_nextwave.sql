ALTER TABLE "job_tracking" ALTER COLUMN "status" SET DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "job_tracking" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;
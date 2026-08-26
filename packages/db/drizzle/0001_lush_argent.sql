CREATE INDEX "idx_contents_published_at" ON "contents" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_contents_category" ON "contents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_contents_source_id" ON "contents" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_entities_mention_count" ON "entities" USING btree ("mention_count");--> statement-breakpoint
CREATE INDEX "idx_entities_last_mentioned_at" ON "entities" USING btree ("last_mentioned_at");--> statement-breakpoint
CREATE INDEX "idx_entity_mentions_entity_id" ON "entity_mentions" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_entity_mentions_content_id" ON "entity_mentions" USING btree ("content_id");
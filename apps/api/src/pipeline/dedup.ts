// apps/api/src/pipeline/dedup.ts
import { db, contents } from "@ai-filter/db";
import { eq, or } from "drizzle-orm";
import type { PipelineContext, PipelineStep } from "./types.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("dedup");

export class DedupStep implements PipelineStep {
  name = "dedup";

  async process(ctx: PipelineContext): Promise<PipelineContext | null> {
    const { raw } = ctx;

    // 检查 URL 或 externalId 是否已存在
    const existing = await db.query.contents.findFirst({
      where: or(
        eq(contents.url, raw.url),
        eq(contents.externalId, raw.externalId)
      ),
    });

    if (existing) {
      logger.debug({ url: raw.url, externalId: raw.externalId }, "Duplicate found, skipping");
      return null;
    }

    return ctx;
  }
}

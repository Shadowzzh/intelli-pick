// apps/api/src/pipeline/types.ts
import type { RawContent, FilterResult, ExtractResult } from "@ai-filter/shared";

export interface PipelineContext {
  raw: RawContent;
  filterResult?: FilterResult;
  extractResult?: ExtractResult;
}

export interface PipelineStep {
  name: string;
  process(ctx: PipelineContext): Promise<PipelineContext | null>;
}

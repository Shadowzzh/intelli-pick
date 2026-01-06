// apps/api/src/pipeline/types.ts
import type {
	ExtractResult,
	FilterResult,
	RawContent,
} from "@ai-filter/shared";

export interface PipelineContext {
	raw: RawContent;
	filterResult?: FilterResult;
	extractResult?: ExtractResult;
}

export interface PipelineStep {
	name: string;
	process(ctx: PipelineContext): Promise<PipelineContext | null>;
}

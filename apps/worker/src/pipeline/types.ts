import type {
	ExtractResult,
	PipelineAiMetrics,
	RawContent,
} from "@intellipick/shared";
// apps/api/src/pipeline/types.ts
import type { Logger } from "pino";

export interface PipelineContext {
	raw: RawContent;
	extractResult?: ExtractResult;
	sourceNames?: string[];
	aiMetrics: PipelineAiMetrics;
}

export enum StepStatus {
	Continue = "continue",
	Filtered = "filtered",
	Error = "error",
}

export interface StepResult {
	status: StepStatus;
	context?: PipelineContext;
	error?: Error;
}

export interface PipelineStep {
	name: string;
	process(ctx: PipelineContext, logger?: Logger): Promise<StepResult>;
}

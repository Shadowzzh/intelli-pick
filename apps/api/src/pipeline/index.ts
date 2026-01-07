import type { Config } from "@intellipick/config";
// apps/api/src/pipeline/index.ts
import type { RawContent } from "@intellipick/shared";
import type { AiClient } from "../lib/ai";
import { createLogger } from "../lib/logger";
import { AiExtractStep } from "./ai-extract";
import { AiFilterStep } from "./ai-filter";
import { DedupStep } from "./dedup";
import { HardFilterStep } from "./hard-filter";
import { StorageStep } from "./storage";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

// Re-export StepStatus as a value
export { StepStatus };

const logger = createLogger("pipeline");

export class Pipeline {
	private steps: PipelineStep[] = [];

	constructor(config: Config, ai: AiClient) {
		this.steps = [
			new HardFilterStep(config.filter.hardRules),
			new AiFilterStep(ai, config.filter),
			new AiExtractStep(ai),
			new StorageStep(config.filter),
		];
	}

	async process(raw: RawContent): Promise<boolean> {
		let ctx: PipelineContext = { raw };

		for (const step of this.steps) {
			logger.debug({ step: step.name }, "Running pipeline step");
			const result = await step.process(ctx);

			if (result.status === StepStatus.Filtered) {
				logger.debug(
					{
						step: step.name,
						reason: result.context?.filterResult?.oneLineWhy,
					},
					"Content filtered out",
				);
				return false;
			}

			if (result.status === StepStatus.Error) {
				logger.error({ step: step.name, error: result.error }, "Step failed");
				return false;
			}

			if (result.status === StepStatus.Continue && result.context) {
				ctx = result.context;
			} else {
				// 不应该到达这里，但作为保险
				logger.warn({ step: step.name, result }, "Unexpected step result");
				return false;
			}
		}

		return true;
	}

	async processAll(
		items: RawContent[],
	): Promise<{ processed: number; passed: number }> {
		let processed = 0;
		let passed = 0;

		for (const item of items) {
			processed++;
			const success = await this.process(item);
			if (success) passed++;
		}

		logger.info({ processed, passed }, "Pipeline completed");
		return { processed, passed };
	}
}

// Re-export types
export type { PipelineContext, PipelineStep, StepResult };

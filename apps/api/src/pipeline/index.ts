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
import type { PipelineContext, PipelineStep } from "./types";

const logger = createLogger("pipeline");

export class Pipeline {
	private steps: PipelineStep[] = [];

	constructor(config: Config, ai: AiClient) {
		this.steps = [
			new DedupStep(),
			new HardFilterStep(config.filter.hardRules),
			new AiFilterStep(ai, config.filter),
			new AiExtractStep(ai),
			new StorageStep(config.filter),
		];
	}

	async process(raw: RawContent): Promise<boolean> {
		let ctx: PipelineContext | null = { raw };

		for (const step of this.steps) {
			if (!ctx) break;

			logger.debug({ step: step.name }, "Running pipeline step");
			ctx = await step.process(ctx);

			if (!ctx) {
				logger.debug({ step: step.name }, "Content filtered out");
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

export type { PipelineContext, PipelineStep } from "./types";

import type { Config } from "@intellipick/config";
// apps/api/src/pipeline/index.ts
import type { RawContent } from "@intellipick/shared";
import type { AiClient } from "../lib/ai";
import { createLogger, createRequestLogger } from "../lib/logger";
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
	private config: Config;

	constructor(config: Config, ai: AiClient) {
		this.config = config;
		const sourceNames = config.sources.map((s) => s.name);

		this.steps = [
			new HardFilterStep(config.filter.hardRules),
			new AiFilterStep(ai, config.filter),
			new AiExtractStep(ai, sourceNames),
			new StorageStep(config.filter),
		];
	}

	async process(raw: RawContent, requestId?: string): Promise<boolean> {
		// 创建带追踪 ID 的 logger
		const requestLogger = requestId
			? createRequestLogger("pipeline", requestId)
			: logger;

		const sourceNames = this.config.sources.map((s) => s.name);
		let ctx: PipelineContext = { raw, sourceNames };

		for (const step of this.steps) {
			requestLogger.debug(
				{ step: step.name, url: raw.url },
				"Running pipeline step",
			);
			const result = await step.process(ctx, requestLogger);

			if (result.status === StepStatus.Filtered) {
				requestLogger.debug(
					{
						step: step.name,
						url: raw.url,
						reason: result.context?.filterResult?.oneLineWhy,
					},
					"Content filtered out",
				);
				return false;
			}

			if (result.status === StepStatus.Error) {
				requestLogger.error(
					{ step: step.name, url: raw.url, error: result.error },
					"Step failed",
				);
				return false;
			}

			if (result.status === StepStatus.Continue && result.context) {
				ctx = result.context;
			} else {
				// 不应该到达这里，但作为保险
				requestLogger.warn(
					{ step: step.name, url: raw.url, result },
					"Unexpected step result",
				);
				return false;
			}
		}

		return true;
	}

	async processAll(
		items: RawContent[],
		requestId?: string,
	): Promise<{ processed: number; passed: number }> {
		const requestLogger = requestId
			? createRequestLogger("pipeline", requestId)
			: logger;

		let processed = 0;
		let passed = 0;

		for (const item of items) {
			processed++;
			const success = await this.process(item, requestId);
			if (success) passed++;
		}

		requestLogger.info({ processed, passed }, "Pipeline batch completed");
		return { processed, passed };
	}
}

// Re-export types
export type { PipelineContext, PipelineStep, StepResult };

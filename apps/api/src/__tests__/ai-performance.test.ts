import type { AiCallMetric } from "@intellipick/shared";
import { describe, expect, it } from "vitest";
import { aggregateAiPerformance } from "../services/job-history.service";

function createMetric(overrides: Partial<AiCallMetric>): AiCallMetric {
	return {
		task: "filter",
		provider: "codex",
		protocol: "responses",
		configuredModel: "gpt-5.6-luna",
		responseModel: "gpt-5.6-luna-2026-08-01",
		success: true,
		durationMs: 1000,
		promptTokens: 100,
		completionTokens: 20,
		totalTokens: 120,
		cachedPromptTokens: 10,
		reasoningTokens: 5,
		finishReason: "stop",
		decision: "pass",
		...overrides,
	};
}

describe("AI performance aggregation", () => {
	it("returns explicit no-sample values for an empty window", () => {
		const result = aggregateAiPerformance([], 24);

		expect(result.windowHours).toBe(24);
		expect(result.filter.calls).toBe(0);
		expect(result.filter.successRate).toBeNull();
		expect(result.filter.passRate).toBeNull();
		expect(result.extract.calls).toBe(0);
		expect(result.avgResponseTime).toBeNull();
		expect(result.totalTokens).toBe(0);
	});

	it("aggregates calls, tokens, models and business pass rate", () => {
		const filterSuccess = createMetric({});
		const filterFailure = createMetric({
			success: false,
			durationMs: 3000,
			promptTokens: null,
			completionTokens: null,
			totalTokens: null,
			cachedPromptTokens: null,
			reasoningTokens: null,
			responseModel: null,
			finishReason: null,
			decision: null,
		});
		const extractSuccess = createMetric({
			task: "extractAndClassify",
			configuredModel: "gpt-5.6-terra",
			responseModel: "gpt-5.6-terra-2026-08-01",
			durationMs: 2000,
			promptTokens: 120,
			completionTokens: 30,
			totalTokens: 150,
			cachedPromptTokens: 20,
			reasoningTokens: 8,
			decision: null,
		});

		const result = aggregateAiPerformance(
			[
				{ success: true },
				{
					aiMetrics: {
						filter: filterSuccess,
						extract: extractSuccess,
					},
				},
				{ aiMetrics: { filter: filterFailure } },
			],
			24,
		);

		expect(result.filter.calls).toBe(2);
		expect(result.filter.successRate).toBe(0.5);
		expect(result.filter.avgResponseTime).toBe(2000);
		expect(result.filter.passRate).toBe(1);
		expect(result.filter.totalTokens).toBe(120);
		expect(result.filter.cachedPromptTokens).toBe(10);
		expect(result.filter.configuredModels).toEqual(["gpt-5.6-luna"]);
		expect(result.filter.responseModels).toEqual(["gpt-5.6-luna-2026-08-01"]);

		expect(result.extract.calls).toBe(1);
		expect(result.extract.successRate).toBe(1);
		expect(result.extract.avgResponseTime).toBe(2000);
		expect(result.extract.totalTokens).toBe(150);
		expect(result.extract.configuredModels).toEqual(["gpt-5.6-terra"]);
		expect(result.totalTokens).toBe(270);
		expect(result.avgResponseTime).toBe(2000);
	});
});

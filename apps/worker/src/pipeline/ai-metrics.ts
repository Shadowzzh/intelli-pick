import type {
	AiCallMetric,
	AiFilterDecision,
	AiMetricProtocol,
	AiMetricTask,
} from "@intellipick/shared";

interface AiTaskInfo {
	provider: string;
	protocol: AiMetricProtocol;
	configuredModel: string;
}

interface AiResultLike {
	usage?: {
		promptTokens?: unknown;
		completionTokens?: unknown;
		totalTokens?: unknown;
	};
	response?: {
		modelId?: unknown;
	};
	providerMetadata?: unknown;
	finishReason?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

function readProviderNumber(
	metadata: unknown,
	provider: string,
	key: string,
): number | null {
	if (!isRecord(metadata)) {
		return null;
	}

	const namespaces = [metadata.openai, metadata[provider]];
	for (const namespace of namespaces) {
		if (!isRecord(namespace)) {
			continue;
		}

		const value = readNumber(namespace[key]);
		if (value !== null) {
			return value;
		}
	}

	return null;
}

export function createAiCallMetric(params: {
	task: AiMetricTask;
	taskInfo: AiTaskInfo;
	success: boolean;
	durationMs: number;
	result?: AiResultLike | unknown;
	decision?: AiFilterDecision;
}): AiCallMetric {
	const result = isRecord(params.result)
		? (params.result as AiResultLike)
		: undefined;
	const usage = result?.usage;

	return {
		task: params.task,
		provider: params.taskInfo.provider,
		protocol: params.taskInfo.protocol,
		configuredModel: params.taskInfo.configuredModel,
		responseModel: readString(result?.response?.modelId),
		success: params.success,
		durationMs: Math.max(0, Math.round(params.durationMs)),
		promptTokens: readNumber(usage?.promptTokens),
		completionTokens: readNumber(usage?.completionTokens),
		totalTokens: readNumber(usage?.totalTokens),
		cachedPromptTokens: readProviderNumber(
			result?.providerMetadata,
			params.taskInfo.provider,
			"cachedPromptTokens",
		),
		reasoningTokens: readProviderNumber(
			result?.providerMetadata,
			params.taskInfo.provider,
			"reasoningTokens",
		),
		finishReason: readString(result?.finishReason),
		decision: params.decision ?? null,
	};
}

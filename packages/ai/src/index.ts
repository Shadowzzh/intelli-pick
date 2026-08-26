import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type {
	AiConfig,
	AiProviderConfig,
	AiTaskName,
} from "@intellipick/config";
import type { LanguageModelV1 } from "ai";

type ModelResolver = (modelId: string) => LanguageModelV1;

function resolveEnvironmentValue(name: string | undefined): string | undefined {
	if (!name) {
		return undefined;
	}

	const value = process.env[name]?.trim();
	return value || undefined;
}

function resolveApiKey(
	providerName: string,
	providerConfig: AiProviderConfig,
): string {
	const apiKey = resolveEnvironmentValue(providerConfig.apiKeyEnv);
	if (!apiKey) {
		throw new Error(
			`AI provider ${providerName} requires environment variable ${providerConfig.apiKeyEnv}`,
		);
	}
	return apiKey;
}

function createModelResolver(
	providerName: string,
	providerConfig: AiProviderConfig,
): ModelResolver {
	const apiKey = resolveApiKey(providerName, providerConfig);
	const baseURL =
		resolveEnvironmentValue(providerConfig.baseUrlEnv) ||
		providerConfig.baseUrl;

	if (providerConfig.type === "anthropic") {
		const provider = createAnthropic({ apiKey, baseURL });
		return (modelId) => provider.messages(modelId);
	}

	const provider = createOpenAI({
		name: providerName,
		apiKey,
		baseURL,
	});
	if (providerConfig.protocol === "responses") {
		return (modelId) => provider.responses(modelId);
	}
	return (modelId) => provider.chat(modelId);
}

export function createAiClient(config: AiConfig) {
	const resolvers = new Map<string, ModelResolver>();

	function getTaskConfig(taskName: AiTaskName) {
		const task = config.tasks[taskName];
		if (!task) {
			throw new Error(`AI task ${taskName} is not configured`);
		}

		return task;
	}

	function getResolver(providerName: string): ModelResolver {
		const cachedResolver = resolvers.get(providerName);
		if (cachedResolver) {
			return cachedResolver;
		}

		const providerConfig = config.providers[providerName];
		if (!providerConfig) {
			throw new Error(`AI provider ${providerName} is not configured`);
		}

		const resolver = createModelResolver(providerName, providerConfig);
		resolvers.set(providerName, resolver);
		return resolver;
	}

	return {
		getModel(taskName: AiTaskName): LanguageModelV1 {
			const task = getTaskConfig(taskName);
			return getResolver(task.provider)(task.model);
		},
		getTaskInfo(taskName: AiTaskName) {
			const task = getTaskConfig(taskName);
			const providerConfig = config.providers[task.provider];
			if (!providerConfig) {
				throw new Error(`AI provider ${task.provider} is not configured`);
			}

			let protocol: "responses" | "chat-completions" | "anthropic";
			if (providerConfig.type === "anthropic") {
				protocol = "anthropic";
			} else {
				protocol = providerConfig.protocol;
			}

			return {
				task: taskName,
				provider: task.provider,
				protocol,
				configuredModel: task.model,
			};
		},
	};
}

export type AiClient = ReturnType<typeof createAiClient>;

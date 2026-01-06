import { createAnthropic } from "@ai-sdk/anthropic";
// apps/api/src/lib/ai.ts
import { createOpenAI } from "@ai-sdk/openai";
import type { Config } from "./config.js";

export function createAiClient(config: Config["ai"]) {
	const providers: Record<
		string,
		ReturnType<typeof createOpenAI> | ReturnType<typeof createAnthropic>
	> = {};

	for (const [name, providerConfig] of Object.entries(config.providers)) {
		if (name === "anthropic") {
			providers[name] = createAnthropic({
				apiKey: providerConfig.apiKey,
			});
		} else {
			// OpenAI 兼容 (DeepSeek 等)
			providers[name] = createOpenAI({
				baseURL: providerConfig.baseUrl,
				apiKey: providerConfig.apiKey,
			});
		}
	}

	return {
		getModel(taskName: keyof Config["ai"]["tasks"]) {
			const task = config.tasks[taskName];
			const provider = providers[task.provider];
			if (!provider) {
				throw new Error(`Provider ${task.provider} not configured`);
			}
			return provider(task.model);
		},
	};
}

export type AiClient = ReturnType<typeof createAiClient>;

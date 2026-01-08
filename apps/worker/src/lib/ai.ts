import { createAnthropic } from "@ai-sdk/anthropic";
// apps/api/src/lib/ai.ts
import { createOpenAI } from "@ai-sdk/openai";
import type { AiConfig } from "@intellipick/config";
import { env } from "@intellipick/env";

export function createAiClient(config: AiConfig) {
	const providers: Record<
		string,
		ReturnType<typeof createOpenAI> | ReturnType<typeof createAnthropic>
	> = {};

	for (const [name, provider] of Object.entries(config.providers)) {
		if (name === "anthropic") {
			providers[name] = createAnthropic({
				baseURL: env.ANTHROPIC_BASE_URL || provider.baseUrl,
				apiKey: env.ANTHROPIC_API_KEY,
			});
		} else if (name === "deepseek") {
			// DeepSeek (OpenAI 兼容)
			providers[name] = createOpenAI({
				baseURL: env.DEEPSEEK_BASE_URL || provider.baseUrl,
				apiKey: env.DEEPSEEK_API_KEY,
			});
		} else {
			// 其他 OpenAI 兼容提供商
			providers[name] = createOpenAI({
				baseURL: env.DEEPSEEK_BASE_URL || provider.baseUrl,
				apiKey: env.DEEPSEEK_API_KEY, // 默认使用 DEEPSEEK_API_KEY
			});
		}
	}

	return {
		getModel(taskName: keyof AiConfig["tasks"]) {
			const task = config.tasks[taskName];
			if (!task) {
				throw new Error(`Task ${taskName} not configured`);
			}
			const provider = providers[task.provider];
			if (!provider) {
				throw new Error(`Provider ${task.provider} not configured`);
			}
			return provider(task.model);
		},
	};
}

export type AiClient = ReturnType<typeof createAiClient>;

// apps/api/src/routes/v1/ai-chat.routes.ts
import type { FastifyInstance } from "fastify";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
	ContentsService,
	EntitiesService,
	SearchService,
} from "../../services/index.js";
import { aiTools } from "../../ai/tools.js";

// Create OpenAI-compatible client for DeepSeek
const deepseek = createOpenAI({
	baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
	apiKey: process.env.DEEPSEEK_API_KEY || "",
});

export async function aiChatRoutes(
	app: FastifyInstance,
	services: {
		contentsService: ContentsService;
		entitiesService: EntitiesService;
		searchService: SearchService;
	},
) {
	app.post("/ai/chat", async (req, reply) => {
		const { message } = req.body as { message: string };

		if (!message) {
			reply.status(400).send({
				success: false,
				error: { code: "VALIDATION_ERROR", message: "Message is required" },
			});
			return;
		}

		try {
			const model = process.env.AI_CHAT_MODEL || "deepseek-chat";

			const result = await generateText({
				model: deepseek(model),
				messages: [
					{
						role: "system",
						content:
							"You are a helpful assistant for querying content from IntelliPick. Use the available tools to search and retrieve information.",
					},
					{ role: "user", content: message },
				],
				tools: aiTools,
				maxSteps: 2,
			});

			// Execute tool calls
			if (result.toolCalls && result.toolCalls.length > 0) {
				const toolResults: any[] = [];

				for (const toolCall of result.toolCalls) {
					let data;

					switch (toolCall.toolName) {
						case "queryContents": {
							const contentsResult =
								await services.contentsService.findPaginated({
									page: 1,
									limit: (toolCall.args as any).limit || 10,
									filters: toolCall.args,
								});
							data = contentsResult.data;
							break;
						}

						case "searchContents": {
							const searchResult =
								await services.searchService.searchContents(
									(toolCall.args as any).query,
									(toolCall.args as any).limit || 10,
								);
							data = searchResult;
							break;
						}

						case "getTrendingEntities": {
							const entitiesResult =
								await services.entitiesService.findTrending({
									page: 1,
									limit: (toolCall.args as any).limit || 10,
								});
							data = entitiesResult.data;
							break;
						}
					}

					toolResults.push({ tool: toolCall.toolName, data });
				}

				// Generate natural language response
				const followUp = await generateText({
					model: deepseek(model),
					messages: [
						{
							role: "system",
							content:
								"Summarize the search results in a friendly, concise way. Use Chinese.",
						},
						{ role: "user", content: message },
						{
							role: "assistant",
							content: `Tool results: ${JSON.stringify(toolResults, null, 2)}`,
						},
					],
				});

				return {
					success: true,
					data: {
						response: followUp.text,
						toolResults,
					},
				};
			}

			// No tool calls, just return the text
			return {
				success: true,
				data: { response: result.text },
			};
		} catch (error: any) {
			req.log.error(error);
			reply.status(500).send({
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: error.message || "AI processing failed",
				},
			});
			return;
		}
	});
}

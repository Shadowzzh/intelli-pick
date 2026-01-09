import { createOpenAI } from "@ai-sdk/openai";
import type { Config } from "@intellipick/config";
import { generateText } from "ai";
// apps/api/src/routes/v1/ai-chat.routes.ts
import type { FastifyInstance } from "fastify";
import type { z } from "zod";
import { aiTools } from "../../ai/tools";
import type {
	ContentsService,
	EntitiesService,
	SearchService,
} from "../../services/index";

// 定义工具结果类型
interface ToolResult {
	tool: string;
	data: unknown;
}

// 定义工具参数类型
type QueryContentsArgs = z.infer<typeof aiTools.queryContents.parameters>;
type SearchContentsArgs = z.infer<typeof aiTools.searchContents.parameters>;
type GetTrendingEntitiesArgs = z.infer<
	typeof aiTools.getTrendingEntities.parameters
>;

export async function aiChatRoutes(
	app: FastifyInstance,
	services: {
		contentsService: ContentsService;
		entitiesService: EntitiesService;
		searchService: SearchService;
	},
	config?: Config,
) {
	// Get AI chat configuration from config
	const chatConfig = config?.ai.tasks.chat;
	const chatProviderConfig = chatConfig
		? config?.ai.providers[chatConfig.provider]
		: null;

	// Create OpenAI-compatible client for AI chat
	const deepseek = createOpenAI({
		baseURL: chatProviderConfig?.baseUrl || "https://api.deepseek.com/v1",
		apiKey: process.env.DEEPSEEK_API_KEY || "",
	});

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
			const model = chatConfig?.model || "deepseek-chat";

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
				const toolResults: ToolResult[] = [];

				for (const toolCall of result.toolCalls) {
					let data: unknown;

					switch (toolCall.toolName) {
						case "queryContents": {
							const args = toolCall.args as QueryContentsArgs;
							const contentsResult =
								await services.contentsService.findPaginated({
									page: 1,
									limit: args.limit || 10,
									filters: args,
								});
							data = contentsResult.data;
							break;
						}

						case "searchContents": {
							const args = toolCall.args as SearchContentsArgs;
							const searchResult = await services.searchService.searchContents(
								args.query,
								args.limit || 10,
							);
							data = searchResult;
							break;
						}

						case "getTrendingEntities": {
							const args = toolCall.args as GetTrendingEntitiesArgs;
							const entitiesResult =
								await services.entitiesService.findTrending({
									page: 1,
									limit: args.limit || 10,
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
		} catch (error: unknown) {
			req.log.error(error);
			reply.status(500).send({
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message:
						error instanceof Error ? error.message : "AI processing failed",
				},
			});
			return;
		}
	});
}

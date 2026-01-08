// apps/api/src/ai/tools.ts
import { tool } from "ai";
import { z } from "zod";

export const aiTools = {
	queryContents: tool({
		description: "Query contents with filters like category, tags, date range",
		parameters: z.object({
			category: z.string().optional().describe("Content category"),
			tags: z.array(z.string()).optional().describe("Array of tags to filter by"),
			limit: z.number().default(10).describe("Maximum number of results to return"),
		}),
	}),

	searchContents: tool({
		description: "Full-text search across content titles, summaries, and text",
		parameters: z.object({
			query: z.string().describe("Search query string"),
			limit: z.number().default(10).describe("Maximum number of results to return"),
		}),
	}),

	getTrendingEntities: tool({
		description:
			"Get trending entities (people, companies, products) ordered by mention count",
		parameters: z.object({
			limit: z.number().default(10).describe("Maximum number of results to return"),
		}),
	}),
};

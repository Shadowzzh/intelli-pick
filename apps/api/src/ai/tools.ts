// apps/api/src/ai/tools.ts
import { tool } from "ai";
import { z } from "zod";

export const aiTools = {
	queryContents: tool({
		// 使用类别、标签、日期范围等过滤器查询内容
		description: "Query contents with filters like category, tags, date range",
		parameters: z.object({
			category: z.string().optional().describe("Content category"),
			tags: z.array(z.string()).optional().describe("Array of tags to filter by"),
			limit: z.number().default(10).describe("Maximum number of results to return"),
		}),
	}),

	searchContents: tool({
		// 搜索内容标题、摘要和正文的全文本
		description: "Full-text search across content titles, summaries, and text",
		parameters: z.object({
			query: z.string().describe("Search query string"),
			limit: z.number().default(10).describe("Maximum number of results to return"),
		}),
	}),

	getTrendingEntities: tool({
		// 获取按提及次数排序的热门实体（人、公司、产品）
		description:
			"Get trending entities (people, companies, products) ordered by mention count",
		parameters: z.object({
			limit: z.number().default(10).describe("Maximum number of results to return"),
		}),
	}),
};

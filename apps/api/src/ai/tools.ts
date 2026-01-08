// apps/api/src/ai/tools.ts
import {
	COMMON_TAG_EXAMPLES,
	CONTENT_CATEGORY_VALUES,
	formatCategoriesForTools,
} from "@intellipick/shared";
import { tool } from "ai";
import { z } from "zod";

export const aiTools = {
	queryContents: tool({
		// 使用类别、标签、日期范围等过滤器查询内容
		description: "根据分类、标签、日期范围等条件查询内容",
		parameters: z.object({
			// ✅ 一级分类：严格枚举
			category: z
				.enum(CONTENT_CATEGORY_VALUES)
				.optional()
				.describe(`内容分类。可选值：${formatCategoriesForTools()}`),

			// ✅ 二级分类：推荐 + 自由生成
			subCategory: z
				.string()
				.optional()
				.describe(
					"二级分类，用于更精细的分类。例如：AI/LLM、前端开发、创业融资、UI设计、职业规划等。可以超出推荐范围自定义生成",
				),

			// ✅ 标签：推荐 + 自由生成
			tags: z
				.array(z.string())
				.optional()
				.describe(
					`标签数组，用于过滤内容。常用标签示例：${COMMON_TAG_EXAMPLES.join(", ")} 等（可以使用推荐标签之外的其他标签）`,
				),

			limit: z.number().default(10).describe("返回结果的最大数量"),
		}),
	}),

	searchContents: tool({
		// 搜索内容标题、摘要和正文的全文本
		description: "全文本搜索内容标题、摘要和正文",
		parameters: z.object({
			query: z.string().describe("搜索查询字符串"),
			limit: z.number().default(10).describe("返回结果的最大数量"),
		}),
	}),

	getTrendingEntities: tool({
		// 获取按提及次数排序的热门实体（人、公司、产品）
		description: "获取热门实体（人、公司、产品等），按提及次数排序",
		parameters: z.object({
			limit: z.number().default(10).describe("返回结果的最大数量"),
		}),
	}),
};

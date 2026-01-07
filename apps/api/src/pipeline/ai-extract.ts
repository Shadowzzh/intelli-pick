import type { ExtractResult } from "@ai-filter/shared";
// apps/api/src/pipeline/ai-extract.ts
import { generateObject } from "ai";
import { z } from "zod";
import type { AiClient } from "../lib/ai";
import { createLogger } from "../lib/logger";
import type { PipelineContext, PipelineStep } from "./types";

const logger = createLogger("ai-extract");

const ExtractResultSchema = z.object({
	title: z.string(),
	summary: z.string(),
	keyPoints: z.array(z.string()),
	dataPoints: z.array(z.string()),
	entities: z.array(
		z.object({
			name: z.string(),
			type: z.enum([
				"tool",
				"project",
				"library",
				"article",
				"person",
				"company",
				"event",
			]),
			url: z.string().optional(),
			description: z.string().optional(),
		}),
	),
	category: z.string(),
	tags: z.array(z.string()),
});

const EXTRACT_PROMPT = `你是一个内容分析器。从以下内容中提取结构化信息。

## 必须返回的字段

### title (必需)
- 如果原文有标题，使用原标题
- 如果没有（如推文），生成一个简洁的标题（<20字）

### summary (必需)
- 用 1-2 句话总结核心内容
- 保留关键信息，去除冗余

### keyPoints (必需)
- 提取核心观点、结论、主张
- 每条观点独立成句
- 最多 5 条
- 如果没有明确观点，返回空数组 []

### dataPoints (必需)
- 提取具体数字、量化信息
- 如：融资金额、性能数据、用户数、价格等
- 格式："[指标] [数值]"
- 如果没有数据点，返回空数组 []

### entities (必需)
实体对象数组，每个实体包含：
- name: 实体名称
- type: 实体类型，必须是以下之一: "tool", "project", "library", "article", "person", "company", "event"
- url: (可选) 相关URL
- description: (可选) 简短描述

注意事项：
- 只提取明确提到的实体，不要推断
- type 必须严格使用上述 7 种类型之一
- 如果没有符合条件的实体，返回空数组 []
- 绝对不要返回字符串或其他非对象类型

### category (必需)
- 内容所属大类
- 如：技术、财经、生活、娱乐、政治、科学等

### tags (必需)
- 细分标签，3-5 个
- 如：AI、LLM、开源、融资、教程等
- 如果无法提取标签，至少返回一个通用标签

## 输入
{{content}}

根据以上要求，输出完整的 JSON 结果，确保所有字段都存在且类型正确。`;

export class AiExtractStep implements PipelineStep {
	name = "ai-extract";

	constructor(private ai: AiClient) {}

	async process(ctx: PipelineContext): Promise<PipelineContext | null> {
		const { raw } = ctx;

		// 如果是 quarantine，跳过提取
		if (ctx.filterResult?.decision === "quarantine") {
			return ctx;
		}

		const prompt = EXTRACT_PROMPT.replace("{{content}}", raw.content);

		try {
			const { object } = await generateObject({
				model: this.ai.getModel("extractAndClassify"),
				schema: ExtractResultSchema,
				prompt,
			});

			ctx.extractResult = object as ExtractResult;

			logger.info(
				{
					title: ctx.extractResult.title,
					category: ctx.extractResult.category,
					tags: ctx.extractResult.tags,
					entitiesCount: ctx.extractResult.entities.length,
				},
				"AI extract result",
			);

			return ctx;
		} catch (err) {
			logger.error({ err }, "AI extract failed");
			// 失败时使用基础信息
			ctx.extractResult = {
				title: raw.title || raw.content.slice(0, 50),
				summary: raw.content.slice(0, 200),
				keyPoints: [],
				dataPoints: [],
				entities: [],
				category: "未分类",
				tags: [],
			};
			return ctx;
		}
	}
}

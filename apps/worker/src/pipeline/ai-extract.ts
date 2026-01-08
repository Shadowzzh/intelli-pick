import type { ExtractResult } from "@intellipick/shared";
// apps/api/src/pipeline/ai-extract.ts
import { generateObject } from "ai";
import type { Logger } from "pino";
import { z } from "zod";
import type { AiClient } from "../lib/ai";
import { createLogger } from "../lib/logger";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("ai-extract");

const ExtractResultSchema = z.object({
	title: z.string(),
	summary: z.string(),
	keyPoints: z.array(z.string()),
	dataPoints: z.array(z.string()),
	entities: z.array(
		z.object({
			name: z.string(),
			type: z.string(), // 完全开放,允许 AI 自由定义
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
实体对象数组,每个实体包含:
- name: 实体名称
- type: 实体类型 (如 person、company、country、location、organization、product 等)
- url: (可选) 相关URL
- description: (可选) 简短描述

注意事项:
- 只提取明确提到的实体,不要推断
- type 可以是任何描述实体类型的字符串
- 常见类型参考: person、company、country、location、organization、product、tool、project、library、article、event
**重要 - 必须排除的实体**:
  1. 不要提取内容来源平台本身作为实体
     - 判断标准：如果实体名称就是内容发布平台的名称（或高度相似），则不提取
     - 例如：在"36氪"的文章中不要提取"36氪"，在"V2EX"的帖子中不要提取"V2EX"
     - 例如：在"少数派"的文章中不要提取"少数派"，在"Twitter"的推文中不要提取"Twitter"或"X"
  2. 特别注意：当前已知的内容来源平台包括（但不仅限于）：
     {{sourceList}}
  3. 但可以提取内容中提到的其他公司、产品、人物等实体
     - 例如：在36氪的文章中提到"字节跳动推出新产品"，应该提取"字节跳动"，但不提取"36氪"
- 如果没有符合条件的实体,返回空数组 []

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

	constructor(
		private ai: AiClient,
		private sourceNames: string[] = [],
	) {}

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;
		const { raw, sourceNames } = ctx;

		// 如果是 quarantine，跳过提取
		if (ctx.filterResult?.decision === "quarantine") {
			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		}

		// 替换占位符
		let prompt = EXTRACT_PROMPT.replace("{{content}}", raw.content);

		// 动态插入 source 列表
		if (sourceNames && sourceNames.length > 0) {
			const sourceList = sourceNames.map((name) => `     - ${name}`).join("\n");
			prompt = prompt.replace("{{sourceList}}", sourceList);
		} else {
			// 如果没有 sourceNames，移除那部分提示
			prompt = prompt.replace(
				"  2. 特别注意：当前已知的内容来源平台包括（但不仅限于）：\n     {{sourceList}}\n",
				"",
			);
		}

		try {
			const { object } = await generateObject({
				model: this.ai.getModel("extractAndClassify"),
				schema: ExtractResultSchema,
				prompt,
			});

			ctx.extractResult = object as ExtractResult;

			log.info(
				{
					url: raw.url,
					title: ctx.extractResult.title,
					category: ctx.extractResult.category,
					tags: ctx.extractResult.tags,
					entitiesCount: ctx.extractResult.entities.length,
				},
				"AI extract result",
			);

			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		} catch (err) {
			log.error({ url: raw.url, err }, "AI extract failed");
			return {
				status: StepStatus.Error,
				error: err as Error,
			};
		}
	}
}

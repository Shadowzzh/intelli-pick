import type { Config } from "@intellipick/config";
import type { FilterResult } from "@intellipick/shared";
// apps/api/src/pipeline/ai-filter.ts
import { generateObject } from "ai";
import type { Logger } from "pino";
import { z } from "zod";
import type { AiClient } from "../lib/ai";
import { createLogger } from "../lib/logger";
import { createAiCallMetric } from "./ai-metrics";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("ai-filter");

const FilterResultSchema = z.object({
	decision: z.enum(["pass", "reject", "quarantine"]),
	valueScore: z.number().min(0).max(100),
	noiseScore: z.number().min(0).max(100),
	safety: z.object({
		nsfwSexual: z.number().min(0).max(3),
		harassment: z.number().min(0).max(3),
		scam: z.number().min(0).max(3),
	}),
	reasons: z.array(z.string()),
	signals: z.array(z.string()),
	oneLineWhy: z.string(),
});

const FILTER_PROMPT = `你是一个内容过滤器。判断以下内容是否应该进入后续处理流程。

## 判定优先级
安全合规 > 信息价值 > 噪声控制

## 特别规则
- 短文本不等于低价值
- 大V对喷若含可验证信息要保留

## 判定标准

### quarantine（隔离）
- 明确色情招嫖、未成年人性相关
- 强诈骗导流
- 个人隐私曝光

### reject（丢弃）
- 广告导流、重复灌水
- 纯情绪表达、无对象无事件
- 无信息增量

### pass（通过）
- 有事件、有对象、有线索
- 出现实体（公司/产品/人物/项目）+ 动作/事件 + 可追踪线索
- 有爆料、风险提示、反驳证据、数据/截图描述

## 必须返回的字段

### decision (必需)
取值: "pass" | "reject" | "quarantine"

### valueScore (必需)
信息价值评分，0-100 的整数

### noiseScore (必需)
噪声程度评分，0-100 的整数

### safety (必需)
安全评估对象，必须包含以下字段：
- nsfwSexual: 0-3 的整数（0=无，1=暗示，2=明确，3=严重）
- harassment: 0-3 的整数（0=无，1=轻微，2=中度，3=严重）
- scam: 0-3 的整数（0=无，1=可疑，2=明确，3=严重）

### reasons (必需)
原因列表，可选值: AD_SPAM, LOW_SIGNAL, PURE_EMOTION, NSFW_SEXUAL, HARASSMENT, SCAM, DUPLICATE, BREAKING_NEWS_STYLE, HAS_EVIDENCE, WATCHLIST_OVERRIDE

### signals (必需)
信号列表，可选值: hasNumbers, hasSourceLink, hasNamedEntities, hasConcreteClaim, isBreakingStyle, hasCodeBlock, hasQuote, mentionsProduct, mentionsPerson, hasDataPoint

### oneLineWhy (必需)
一句话解释判定原因

## 输入
作者: {{author}}
来源: {{sourceType}}
内容:
{{content}}

根据以上规则，输出完整的 JSON 判定结果，确保包含所有必需字段。`;

export class AiFilterStep implements PipelineStep {
	name = "ai-filter";

	constructor(
		private ai: AiClient,
		private config: Config["filter"],
	) {}

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;
		const { raw } = ctx;
		const taskInfo = this.ai.getTaskInfo("filter");
		const startedAt = Date.now();

		const prompt = FILTER_PROMPT.replace("{{author}}", raw.author || "unknown")
			.replace("{{sourceType}}", raw.sourceType)
			.replace("{{content}}", raw.content);

		try {
			const generation = await generateObject({
				model: this.ai.getModel("filter"),
				schema: FilterResultSchema,
				prompt,
			});

			const durationMs = Date.now() - startedAt;
			const result = generation.object as FilterResult;
			log.info(
				{
					url: raw.url,
					decision: result.decision,
					valueScore: result.valueScore,
					noiseScore: result.noiseScore,
				},
				"AI filter result",
			);
			log.debug({ url: raw.url, result }, "AI filter detailed result");

			// 应用阈值调整
			if (
				result.decision === "pass" &&
				result.valueScore < this.config.thresholds.passMinValueScore
			) {
				result.decision = "reject";
				result.reasons.push("BELOW_VALUE_THRESHOLD");
			}

			// 安全检查
			if (this.config.thresholds.quarantineOnSafety) {
				const { safety } = result;
				if (
					safety.nsfwSexual >= 2 ||
					safety.harassment >= 2 ||
					safety.scam >= 2
				) {
					result.decision = "quarantine";
				}
			}

			// 边界情况保护：如果最终决策是 reject 但分数 >= 阈值，改为 quarantine
			// 这样可以保留可能有价值的内容，避免假阳性
			if (
				result.decision === "reject" &&
				result.valueScore >= this.config.thresholds.rejectToQuarantineMinScore
			) {
				result.decision = "quarantine";
				result.reasons.push("EDGE_CASE_PROTECTION");
			}

			ctx.filterResult = result;
			ctx.aiMetrics.filter = createAiCallMetric({
				task: "filter",
				taskInfo,
				success: true,
				durationMs,
				result: generation,
				decision: result.decision,
			});

			if (result.decision === "reject") {
				return {
					status: StepStatus.Filtered,
					context: ctx,
				};
			}

			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		} catch (err) {
			ctx.aiMetrics.filter = createAiCallMetric({
				task: "filter",
				taskInfo,
				success: false,
				durationMs: Date.now() - startedAt,
				result: err,
			});
			log.error({ url: raw.url, err }, "AI filter failed");
			return {
				status: StepStatus.Error,
				context: ctx,
				error: err as Error,
			};
		}
	}
}

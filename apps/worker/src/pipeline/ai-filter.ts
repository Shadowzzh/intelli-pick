import type { Config } from "@intellipick/config";
import type {
	FilterReason,
	FilterResult,
	RawContent,
} from "@intellipick/shared";
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
const FILTER_TITLE_MAX_CHARS = 200;
const FILTER_EXCERPT_MAX_CHARS = 300;

const FilterResultSchema = z.object({
	decision: z.enum(["pass", "reject", "quarantine"]),
	valueScore: z.number().int().min(0).max(100),
	noiseScore: z.number().int().min(0).max(100),
	safety: z.object({
		nsfwSexual: z.number().int().min(0).max(3),
		harassment: z.number().int().min(0).max(3),
		scam: z.number().int().min(0).max(3),
	}),
	reasons: z.array(z.string()),
	signals: z.array(z.string()),
	oneLineWhy: z.string(),
});

const FILTER_PROMPT = `你是快速内容预筛选器，只判断内容是否值得进入后续分析，不做事实核验。

保留：明确产品、公司、人物或项目的动态；套餐、价格、性能、版本、政策变化；具体问题、风险、经验或解决方案。论坛求助和个人经验只要有明确对象与事件，就不算低价值。
拒绝：广告导流、重复灌水、纯情绪、无明确对象或无信息增量。
不确定时返回 quarantine，不要因为没有正文而拒绝信息明确的标题。安全风险始终返回 quarantine。

评分与决策必须一致：
- pass：valueScore 50-100
- quarantine：valueScore 30-49，或真实性不确定、安全待审
- reject：valueScore 0-29
- noiseScore 只衡量噪声，0 最低、100 最高

返回 decision、valueScore、noiseScore、safety、reasons、signals、oneLineWhy。safety 的 nsfwSexual、harassment、scam 均为 0-3；oneLineWhy 不超过 30 个汉字。
reasons 使用 AD_SPAM、LOW_SIGNAL、PURE_EMOTION、NSFW_SEXUAL、HARASSMENT、SCAM、DUPLICATE、HAS_EVIDENCE。
signals 使用 hasNumbers、hasSourceLink、hasNamedEntities、hasConcreteClaim、mentionsProduct、mentionsPerson、hasDataPoint。`;

function normalizeFilterText(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function readHostname(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return "未知";
	}
}

export function createLightweightFilterPrompt(raw: RawContent): string {
	const normalizedTitle = normalizeFilterText(raw.title || "").slice(
		0,
		FILTER_TITLE_MAX_CHARS,
	);
	const lines = [
		FILTER_PROMPT,
		"",
		"输入：",
		`标题：${normalizedTitle || "（无标题）"}`,
		`数据源：${raw.sourceName || raw.sourceType}`,
		`链接域名：${readHostname(raw.url)}`,
	];

	if (!normalizedTitle) {
		const excerpt = normalizeFilterText(raw.content).slice(
			0,
			FILTER_EXCERPT_MAX_CHARS,
		);
		lines.push(`无标题内容片段：${excerpt || "（无可用文本）"}`);
	}

	return lines.join("\n");
}

function addReason(result: FilterResult, reason: FilterReason): void {
	if (!result.reasons.includes(reason)) {
		result.reasons.push(reason);
	}
}

export function applyFilterDecisionRules(
	modelResult: FilterResult,
	thresholds: Config["filter"]["thresholds"],
): FilterResult {
	const result: FilterResult = {
		...modelResult,
		reasons: [...modelResult.reasons],
		signals: [...modelResult.signals],
	};

	if (thresholds.quarantineOnSafety) {
		const { safety } = result;
		if (safety.nsfwSexual >= 2 || safety.harassment >= 2 || safety.scam >= 2) {
			result.decision = "quarantine";
			return result;
		}
	}

	if (
		result.decision === "pass" &&
		result.valueScore < thresholds.passMinValueScore
	) {
		addReason(result, "BELOW_VALUE_THRESHOLD");
		if (result.valueScore <= thresholds.rejectMaxValueScore) {
			result.decision = "reject";
		} else {
			result.decision = "quarantine";
			addReason(result, "EDGE_CASE_PROTECTION");
		}
	} else if (
		result.decision === "reject" &&
		result.valueScore > thresholds.rejectMaxValueScore
	) {
		result.decision = "quarantine";
		addReason(result, "EDGE_CASE_PROTECTION");
	}

	return result;
}

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

		const prompt = createLightweightFilterPrompt(raw);

		try {
			const generation = await generateObject({
				model: this.ai.getModel("filter"),
				schema: FilterResultSchema,
				prompt,
				maxTokens: 400,
			});

			const durationMs = Date.now() - startedAt;
			const modelResult = generation.object as FilterResult;
			const result = applyFilterDecisionRules(
				modelResult,
				this.config.thresholds,
			);
			log.info(
				{
					url: raw.url,
					modelDecision: modelResult.decision,
					decision: result.decision,
					valueScore: result.valueScore,
					noiseScore: result.noiseScore,
					inputMode: raw.title?.trim() ? "title" : "excerpt",
				},
				"AI filter result",
			);
			log.debug({ url: raw.url, result }, "AI filter detailed result");

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

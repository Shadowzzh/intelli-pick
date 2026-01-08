// apps/api/src/pipeline/hard-filter.ts
import type { Config } from "@intellipick/config";
import type { Logger } from "pino";
import { createLogger } from "../lib/logger";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("hard-filter");

/**
 * 硬性过滤步骤
 * 根据配置的规则过滤明显不合格的内容
 */
export class HardFilterStep implements PipelineStep {
	name = "hard-filter";

	constructor(private config: Config["filter"]["hardRules"]) {}

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;

		if (!this.config.enabled) {
			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		}

		const { raw } = ctx;
		const content = raw.content.toLowerCase();
		const url = raw.url.toLowerCase();

		// 检查黑名单域名
		for (const domain of this.config.blacklistDomains) {
			if (url.includes(domain.toLowerCase())) {
				log.debug({ url: raw.url, domain }, "Blocked by blacklist domain");
				return {
					status: StepStatus.Filtered,
					context: ctx,
				};
			}
		}

		// 检查垃圾关键词
		for (const keyword of this.config.spamKeywords) {
			if (content.includes(keyword.toLowerCase())) {
				log.debug({ url: raw.url, keyword }, "Blocked by spam keyword");
				return {
					status: StepStatus.Filtered,
					context: ctx,
				};
			}
		}

		// 检查纯表情/纯噪声
		const trimmed = raw.content.trim();

		// 检查过短且无链接
		if (trimmed.length < 5 && !raw.url && !content.includes("http")) {
			log.debug(
				{ url: raw.url, length: trimmed.length },
				"Blocked: too short without links",
			);
			return {
				status: StepStatus.Filtered,
				context: ctx,
			};
		}

		return {
			status: StepStatus.Continue,
			context: ctx,
		};
	}
}

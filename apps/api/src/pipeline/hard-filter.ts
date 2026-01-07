// apps/api/src/pipeline/hard-filter.ts
import type { Config } from "@intellipick/config";
import { createLogger } from "../lib/logger";
import type { PipelineContext, PipelineStep } from "./types";

const logger = createLogger("hard-filter");

/**
 * 硬性过滤步骤
 * 根据配置的规则过滤明显不合格的内容
 */
export class HardFilterStep implements PipelineStep {
	name = "hard-filter";

	constructor(private config: Config["filter"]["hardRules"]) {}

	async process(ctx: PipelineContext): Promise<PipelineContext | null> {
		if (!this.config.enabled) {
			return ctx;
		}

		const { raw } = ctx;
		const content = raw.content.toLowerCase();
		const url = raw.url.toLowerCase();

		// 检查黑名单域名
		for (const domain of this.config.blacklistDomains) {
			if (url.includes(domain.toLowerCase())) {
				logger.debug({ url, domain }, "Blocked by blacklist domain");
				return null;
			}
		}

		// 检查垃圾关键词
		for (const keyword of this.config.spamKeywords) {
			if (content.includes(keyword.toLowerCase())) {
				logger.debug({ keyword }, "Blocked by spam keyword");
				return null;
			}
		}

		// 检查纯表情/纯噪声
		const trimmed = raw.content.trim();

		// 检查过短且无链接
		if (trimmed.length < 5 && !raw.url && !content.includes("http")) {
			logger.debug(
				{ length: trimmed.length },
				"Blocked: too short without links",
			);
			return null;
		}

		return ctx;
	}
}

// apps/api/src/pipeline/hard-filter.ts
import type { Config } from "../lib/config.js";
import { createLogger } from "../lib/logger.js";
import type { PipelineContext, PipelineStep } from "./types.js";

const logger = createLogger("hard-filter");

// 纯表情/纯脏话正则
const PURE_EMOJI_REGEX = /^[\s\p{Emoji}\p{Emoji_Component}]+$/u;
const PURE_NOISE_REGEX =
	/^[\s哈嘿呵嘻666好的可以是的对啊卧槽艹牛逼nb厉害👍🏻👎😂🤣😭😅🙏]+$/iu;

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
		if (PURE_EMOJI_REGEX.test(trimmed) || PURE_NOISE_REGEX.test(trimmed)) {
			logger.debug(
				{ content: trimmed.slice(0, 50) },
				"Blocked: pure emoji/noise",
			);
			return null;
		}

		// 检查过短且无链接
		if (trimmed.length < 20 && !raw.url && !content.includes("http")) {
			logger.debug(
				{ length: trimmed.length },
				"Blocked: too short without links",
			);
			return null;
		}

		return ctx;
	}
}

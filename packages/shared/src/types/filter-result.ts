// packages/shared/src/types/filter-result.ts

/**
 * AI 过滤输出结构
 */
export interface FilterResult {
	decision: "pass" | "reject" | "quarantine";
	valueScore: number; // 0-100 信息价值
	noiseScore: number; // 0-100 噪声程度
	safety: {
		nsfwSexual: number; // 0-3
		harassment: number; // 0-3
		scam: number; // 0-3
	};
	reasons: FilterReason[];
	signals: FilterSignal[];
	oneLineWhy: string;
}

export type FilterReason =
	| "AD_SPAM"
	| "LOW_SIGNAL"
	| "PURE_EMOTION"
	| "NSFW_SEXUAL"
	| "HARASSMENT"
	| "SCAM"
	| "DUPLICATE"
	| "BREAKING_NEWS_STYLE"
	| "HAS_EVIDENCE"
	| "WATCHLIST_OVERRIDE"
	| "BELOW_VALUE_THRESHOLD"
	| "AI_FILTER_ERROR";

export type FilterSignal =
	| "hasNumbers"
	| "hasSourceLink"
	| "hasNamedEntities"
	| "hasConcreteClaim"
	| "isBreakingStyle"
	| "hasCodeBlock"
	| "hasQuote"
	| "mentionsProduct"
	| "mentionsPerson"
	| "hasDataPoint";

export interface DedupContentInput {
	id: string;
	sourceId: string | null;
	sourceName: string;
	externalId: string | null;
	title: string | null;
	url: string | null;
	publishedAt: string | null;
	collectedAt: string | null;
}

export type DuplicateClassification = "exact" | "automatic" | "review";

export interface DuplicateCandidate {
	classification: DuplicateClassification;
	reason:
		| "same_source_external_id"
		| "canonical_url"
		| "normalized_title"
		| "near_title";
	similarity: number;
	editSimilarity: number;
	simhashDistance: number;
	lengthRatio: number;
	keyTokensMatch: boolean;
	timeDistanceHours: number | null;
	left: DedupContentInput;
	right: DedupContentInput;
}

export interface DuplicateAuditOptions {
	automaticThreshold: number;
	reviewThreshold: number;
	automaticMaxTimeDistanceHours: number;
	sameSourceAutomaticMaxTimeDistanceHours: number;
	maxTimeDistanceHours: number;
}

export const DEFAULT_DUPLICATE_AUDIT_OPTIONS: DuplicateAuditOptions = {
	automaticThreshold: 0.92,
	reviewThreshold: 0.82,
	automaticMaxTimeDistanceHours: 24,
	sameSourceAutomaticMaxTimeDistanceHours: 6,
	maxTimeDistanceHours: 7 * 24,
};

interface PreparedDedupContent {
	item: DedupContentInput;
	canonicalUrl: string | null;
	normalizedTitle: string;
	keyTokens: string[];
	ngrams2: Set<string>;
	ngrams3: Set<string>;
	simhash2: bigint;
	simhash3: bigint;
}

const TRACKING_QUERY_KEYS = new Set([
	"fbclid",
	"from",
	"gclid",
	"ref",
	"share",
	"share_source",
	"source",
	"spm",
]);

const TITLE_PREFIX_PATTERN =
	/^(?:[【\[]?(?:转载|快讯|最新|突发|重磅|更新|消息)[】\]]?[\s:：-]*)+/u;

export function canonicalizeUrl(value: string | null): string | null {
	if (!value) {
		return null;
	}

	try {
		const url = new URL(value);
		url.hash = "";
		url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
		for (const key of [...url.searchParams.keys()]) {
			const normalizedKey = key.toLowerCase();
			if (
				normalizedKey.startsWith("utm_") ||
				TRACKING_QUERY_KEYS.has(normalizedKey)
			) {
				url.searchParams.delete(key);
			}
		}
		url.searchParams.sort();
		if (url.pathname.length > 1) {
			url.pathname = url.pathname.replace(/\/+$/, "");
		}
		return url.toString();
	} catch {
		return value.trim() || null;
	}
}

export function normalizeDedupTitle(value: string | null): string {
	if (!value) {
		return "";
	}

	return value
		.normalize("NFKC")
		.toLowerCase()
		.replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
		.replace(TITLE_PREFIX_PATTERN, "")
		.replace(/[\p{P}\p{S}\s]+/gu, "")
		.trim();
}

export function extractDedupKeyTokens(value: string | null): string[] {
	if (!value) {
		return [];
	}

	const normalized = value.normalize("NFKC").toLowerCase();
	const tokens = new Set<string>();
	const modelPattern =
		/(?:gpt|glm|qwen|claude|deepseek|llama|gemini|v)[\s-]*\d+(?:\.\d+)*/giu;
	const numberPattern =
		/\d+(?:\.\d+)*(?:%|元|美元|人民币|万|亿|k|m|b|gb|tb)?/giu;

	for (const match of normalized.matchAll(modelPattern)) {
		tokens.add(match[0].replace(/[\s-]+/g, ""));
	}
	for (const match of normalized.matchAll(numberPattern)) {
		tokens.add(match[0]);
	}

	return [...tokens].sort();
}

function createNgrams(value: string, size: number): Set<string> {
	const characters = [...value];
	if (characters.length === 0) {
		return new Set();
	}
	if (characters.length <= size) {
		return new Set([value]);
	}

	const ngrams = new Set<string>();
	for (let index = 0; index <= characters.length - size; index++) {
		ngrams.add(characters.slice(index, index + size).join(""));
	}
	return ngrams;
}

function calculateJaccard(left: Set<string>, right: Set<string>): number {
	if (left.size === 0 || right.size === 0) {
		return 0;
	}

	let intersection = 0;
	for (const token of left) {
		if (right.has(token)) {
			intersection++;
		}
	}
	const union = left.size + right.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

function calculateEditSimilarity(left: string, right: string): number {
	const leftCharacters = [...left];
	const rightCharacters = [...right];
	const longestLength = Math.max(leftCharacters.length, rightCharacters.length);
	if (longestLength === 0) {
		return 1;
	}

	let previous = Array.from(
		{ length: rightCharacters.length + 1 },
		(_, index) => index,
	);
	for (let leftIndex = 1; leftIndex <= leftCharacters.length; leftIndex++) {
		const current = [leftIndex];
		for (
			let rightIndex = 1;
			rightIndex <= rightCharacters.length;
			rightIndex++
		) {
			const substitutionCost =
				leftCharacters[leftIndex - 1] === rightCharacters[rightIndex - 1]
					? 0
					: 1;
			current[rightIndex] = Math.min(
				current[rightIndex - 1] + 1,
				previous[rightIndex] + 1,
				previous[rightIndex - 1] + substitutionCost,
			);
		}
		previous = current;
	}

	const distance = previous[rightCharacters.length];
	return 1 - distance / longestLength;
}

function hashToken64(value: string): bigint {
	let hash = 0xcbf29ce484222325n;
	const prime = 0x100000001b3n;
	for (const character of value) {
		hash ^= BigInt(character.codePointAt(0) || 0);
		hash = BigInt.asUintN(64, hash * prime);
	}
	return hash;
}

function createSimhash(tokens: Set<string>): bigint {
	const weights = Array<number>(64).fill(0);
	for (const token of tokens) {
		const hash = hashToken64(token);
		for (let bit = 0; bit < 64; bit++) {
			const mask = 1n << BigInt(bit);
			weights[bit] += (hash & mask) === 0n ? -1 : 1;
		}
	}

	let fingerprint = 0n;
	for (let bit = 0; bit < weights.length; bit++) {
		if (weights[bit] >= 0) {
			fingerprint |= 1n << BigInt(bit);
		}
	}
	return fingerprint;
}

function calculateHammingDistance(left: bigint, right: bigint): number {
	let value = left ^ right;
	let distance = 0;
	while (value > 0n) {
		distance += Number(value & 1n);
		value >>= 1n;
	}
	return distance;
}

function calculateTimeDistanceHours(
	left: DedupContentInput,
	right: DedupContentInput,
): number | null {
	const leftValue = left.publishedAt || left.collectedAt;
	const rightValue = right.publishedAt || right.collectedAt;
	if (!leftValue || !rightValue) {
		return null;
	}

	const leftTime = new Date(leftValue).getTime();
	const rightTime = new Date(rightValue).getTime();
	if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
		return null;
	}
	return Math.abs(leftTime - rightTime) / 1000 / 60 / 60;
}

function haveMatchingKeyTokens(leftTokens: string[], rightTokens: string[]) {
	return (
		leftTokens.length === rightTokens.length &&
		leftTokens.every((token, index) => token === rightTokens[index])
	);
}

function prepareDedupContent(item: DedupContentInput): PreparedDedupContent {
	const normalizedTitle = normalizeDedupTitle(item.title);
	const ngrams2 = createNgrams(normalizedTitle, 2);
	const ngrams3 = createNgrams(normalizedTitle, 3);
	return {
		item,
		canonicalUrl: canonicalizeUrl(item.url),
		normalizedTitle,
		keyTokens: extractDedupKeyTokens(item.title),
		ngrams2,
		ngrams3,
		simhash2: createSimhash(ngrams2),
		simhash3: createSimhash(ngrams3),
	};
}

export function compareDuplicateCandidates(
	left: DedupContentInput,
	right: DedupContentInput,
	options: DuplicateAuditOptions = DEFAULT_DUPLICATE_AUDIT_OPTIONS,
): DuplicateCandidate | null {
	return comparePreparedCandidates(
		prepareDedupContent(left),
		prepareDedupContent(right),
		options,
	);
}

function comparePreparedCandidates(
	leftPrepared: PreparedDedupContent,
	rightPrepared: PreparedDedupContent,
	options: DuplicateAuditOptions,
): DuplicateCandidate | null {
	const left = leftPrepared.item;
	const right = rightPrepared.item;
	if (
		left.sourceId &&
		right.sourceId &&
		left.sourceId === right.sourceId &&
		left.externalId &&
		left.externalId === right.externalId
	) {
		return createExactCandidate(left, right, "same_source_external_id");
	}

	const leftUrl = leftPrepared.canonicalUrl;
	const rightUrl = rightPrepared.canonicalUrl;
	if (leftUrl && rightUrl && leftUrl === rightUrl) {
		return createExactCandidate(left, right, "canonical_url");
	}

	const leftTitle = leftPrepared.normalizedTitle;
	const rightTitle = rightPrepared.normalizedTitle;
	if (!leftTitle || !rightTitle) {
		return null;
	}

	const shortestLength = Math.min(leftTitle.length, rightTitle.length);
	const longestLength = Math.max(leftTitle.length, rightTitle.length);
	const lengthRatio = shortestLength / longestLength;
	if (shortestLength < 6 || lengthRatio < 0.45) {
		return null;
	}
	const ngramSize = shortestLength < 12 ? 2 : 3;
	let leftNgrams = leftPrepared.ngrams3;
	let rightNgrams = rightPrepared.ngrams3;
	let leftSimhash = leftPrepared.simhash3;
	let rightSimhash = rightPrepared.simhash3;
	if (ngramSize === 2) {
		leftNgrams = leftPrepared.ngrams2;
		rightNgrams = rightPrepared.ngrams2;
		leftSimhash = leftPrepared.simhash2;
		rightSimhash = rightPrepared.simhash2;
	}
	const similarity = calculateJaccard(leftNgrams, rightNgrams);
	let editSimilarity = 0;
	if (lengthRatio >= options.reviewThreshold || similarity >= 0.72) {
		editSimilarity = calculateEditSimilarity(leftTitle, rightTitle);
	}
	const strongestSimilarity = Math.max(similarity, editSimilarity);
	const simhashDistance = calculateHammingDistance(leftSimhash, rightSimhash);
	const keyTokensMatch = haveMatchingKeyTokens(
		leftPrepared.keyTokens,
		rightPrepared.keyTokens,
	);
	const timeDistanceHours = calculateTimeDistanceHours(left, right);
	const withinTimeWindow =
		timeDistanceHours === null ||
		timeDistanceHours <= options.maxTimeDistanceHours;
	let automaticTimeLimit = options.automaticMaxTimeDistanceHours;
	if (left.sourceId === right.sourceId) {
		automaticTimeLimit = options.sameSourceAutomaticMaxTimeDistanceHours;
	}
	const withinAutomaticTimeWindow =
		timeDistanceHours === null || timeDistanceHours <= automaticTimeLimit;

	if (
		leftTitle === rightTitle &&
		left.sourceId !== right.sourceId &&
		withinAutomaticTimeWindow &&
		shortestLength >= 8 &&
		keyTokensMatch
	) {
		return {
			classification: "automatic",
			reason: "normalized_title",
			similarity: 1,
			editSimilarity: 1,
			simhashDistance: 0,
			lengthRatio,
			keyTokensMatch,
			timeDistanceHours,
			left,
			right,
		};
	}
	if (
		leftTitle === rightTitle &&
		left.sourceId === right.sourceId &&
		withinTimeWindow &&
		shortestLength >= 6
	) {
		return {
			classification: "review",
			reason: "normalized_title",
			similarity: 1,
			editSimilarity: 1,
			simhashDistance: 0,
			lengthRatio,
			keyTokensMatch,
			timeDistanceHours,
			left,
			right,
		};
	}

	const automaticBySimilarity =
		strongestSimilarity >= options.automaticThreshold && lengthRatio >= 0.72;
	const automaticBySimhash =
		similarity >= options.reviewThreshold && simhashDistance <= 3;
	if (
		withinAutomaticTimeWindow &&
		shortestLength >= 8 &&
		keyTokensMatch &&
		(automaticBySimilarity || automaticBySimhash)
	) {
		return {
			classification: "automatic",
			reason: "near_title",
			similarity,
			editSimilarity,
			simhashDistance,
			lengthRatio,
			keyTokensMatch,
			timeDistanceHours,
			left,
			right,
		};
	}

	const needsReview =
		withinTimeWindow &&
		shortestLength >= 6 &&
		(strongestSimilarity >= options.reviewThreshold ||
			(similarity >= 0.72 && simhashDistance <= 6));
	if (!needsReview) {
		return null;
	}

	return {
		classification: "review",
		reason: "near_title",
		similarity,
		editSimilarity,
		simhashDistance,
		lengthRatio,
		keyTokensMatch,
		timeDistanceHours,
		left,
		right,
	};
}

function createExactCandidate(
	left: DedupContentInput,
	right: DedupContentInput,
	reason: "same_source_external_id" | "canonical_url",
): DuplicateCandidate {
	return {
		classification: "exact",
		reason,
		similarity: 1,
		editSimilarity: 1,
		simhashDistance: 0,
		lengthRatio: 1,
		keyTokensMatch: true,
		timeDistanceHours: calculateTimeDistanceHours(left, right),
		left,
		right,
	};
}

export function findDuplicateCandidates(
	items: DedupContentInput[],
	options: DuplicateAuditOptions = DEFAULT_DUPLICATE_AUDIT_OPTIONS,
): DuplicateCandidate[] {
	const candidates: DuplicateCandidate[] = [];
	const preparedItems = items.map(prepareDedupContent);
	for (let leftIndex = 0; leftIndex < preparedItems.length; leftIndex++) {
		for (
			let rightIndex = leftIndex + 1;
			rightIndex < preparedItems.length;
			rightIndex++
		) {
			const candidate = comparePreparedCandidates(
				preparedItems[leftIndex],
				preparedItems[rightIndex],
				options,
			);
			if (candidate) {
				candidates.push(candidate);
			}
		}
	}
	return sortDuplicateCandidates(candidates);
}

export function findDuplicateCandidatesForItem(
	item: DedupContentInput,
	recentItems: DedupContentInput[],
	options: DuplicateAuditOptions = DEFAULT_DUPLICATE_AUDIT_OPTIONS,
): DuplicateCandidate[] {
	const preparedItem = prepareDedupContent(item);
	const candidates: DuplicateCandidate[] = [];
	for (const recentItem of recentItems) {
		const candidate = comparePreparedCandidates(
			preparedItem,
			prepareDedupContent(recentItem),
			options,
		);
		if (candidate) {
			candidates.push(candidate);
		}
	}
	return sortDuplicateCandidates(candidates);
}

function sortDuplicateCandidates(
	candidates: DuplicateCandidate[],
): DuplicateCandidate[] {
	const classificationOrder: Record<DuplicateClassification, number> = {
		exact: 0,
		automatic: 1,
		review: 2,
	};
	return candidates.sort((left, right) => {
		const classificationDifference =
			classificationOrder[left.classification] -
			classificationOrder[right.classification];
		if (classificationDifference !== 0) {
			return classificationDifference;
		}
		return (
			Math.max(right.similarity, right.editSimilarity) -
			Math.max(left.similarity, left.editSimilarity)
		);
	});
}

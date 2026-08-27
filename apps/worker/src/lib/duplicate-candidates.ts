import {
	type Content,
	contentDuplicateCandidates,
	contents,
	db,
	sources,
} from "@intellipick/db";
import {
	type DedupContentInput,
	findDuplicateCandidatesForItem,
} from "@intellipick/shared";
import { and, desc, eq, gte, isNotNull, ne } from "drizzle-orm";

const DUPLICATE_LOOKBACK_DAYS = 7;

function toIsoString(value: Date | null): string | null {
	return value ? value.toISOString() : null;
}

function toDedupInput(params: {
	id: string;
	sourceId: string | null;
	sourceName: string | null;
	externalId: string | null;
	title: string | null;
	url: string | null;
	publishedAt: Date | null;
	collectedAt: Date | null;
}): DedupContentInput {
	return {
		id: params.id,
		sourceId: params.sourceId,
		sourceName: params.sourceName || "未知来源",
		externalId: params.externalId,
		title: params.title,
		url: params.url,
		publishedAt: toIsoString(params.publishedAt),
		collectedAt: toIsoString(params.collectedAt),
	};
}

export async function recordDuplicateCandidates(params: {
	content: Content;
	sourceName?: string;
}): Promise<{ detected: number; inserted: number }> {
	const startDate = new Date(
		Date.now() - DUPLICATE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
	);
	const recentContents = await db
		.select({
			id: contents.id,
			sourceId: contents.sourceId,
			sourceName: sources.name,
			externalId: contents.externalId,
			title: contents.title,
			url: contents.url,
			publishedAt: contents.publishedAt,
			collectedAt: contents.collectedAt,
		})
		.from(contents)
		.leftJoin(sources, eq(sources.id, contents.sourceId))
		.where(
			and(
				ne(contents.id, params.content.id),
				gte(contents.collectedAt, startDate),
				isNotNull(contents.title),
			),
		)
		.orderBy(desc(contents.collectedAt));

	const current = toDedupInput({
		id: params.content.id,
		sourceId: params.content.sourceId,
		sourceName: params.sourceName || null,
		externalId: params.content.externalId,
		title: params.content.title,
		url: params.content.url,
		publishedAt: params.content.publishedAt,
		collectedAt: params.content.collectedAt,
	});
	const comparisons = findDuplicateCandidatesForItem(
		current,
		recentContents.map(toDedupInput),
	);
	const values: (typeof contentDuplicateCandidates.$inferInsert)[] = [];
	for (const comparison of comparisons) {
		let leftContentId = comparison.left.id;
		let rightContentId = comparison.right.id;
		if (leftContentId > rightContentId) {
			leftContentId = comparison.right.id;
			rightContentId = comparison.left.id;
		}
		values.push({
			leftContentId,
			rightContentId,
			classification: comparison.classification,
			reason: comparison.reason,
			similarity: comparison.similarity,
			editSimilarity: comparison.editSimilarity,
			simhashDistance: comparison.simhashDistance,
			lengthRatio: comparison.lengthRatio,
			keyTokensMatch: comparison.keyTokensMatch,
			timeDistanceHours: comparison.timeDistanceHours,
			status: "pending",
		});
	}

	if (values.length === 0) {
		return { detected: 0, inserted: 0 };
	}
	const inserted = await db
		.insert(contentDuplicateCandidates)
		.values(values)
		.onConflictDoNothing()
		.returning({ id: contentDuplicateCandidates.id });
	return { detected: values.length, inserted: inserted.length };
}

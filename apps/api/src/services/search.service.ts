// apps/api/src/services/search.service.ts
import { contents } from "@intellipick/db";
import { ilike, or } from "drizzle-orm";
import type {
	ContentSearchResult,
	EntitySearchResult,
	SearchResult,
} from "@intellipick/shared";
import type { Database } from "@intellipick/db";

export class SearchService {
	constructor(private db: Database) {}

	async searchContents(
		query: string,
		limit = 20,
	): Promise<ContentSearchResult[]> {
		// Simple ILIKE search for now (can be upgraded to tsvector later)
		const results = await this.db
			.select({
				id: contents.id,
				title: contents.title,
				summary: contents.summary,
			})
			.from(contents)
			.where(
				or(
					ilike(contents.title, `%${query}%`),
					ilike(contents.summary, `%${query}%`),
					ilike(contents.rawContent, `%${query}%`),
				),
			)
			.limit(limit);

		return results.map((r, i) => ({
			...r,
			rank: limit - i, // Simple ranking
		}));
	}

	async search(query: string, limit = 20): Promise<SearchResult> {
		const contents = await this.searchContents(query, limit);

		return {
			contents,
			entities: [], // TODO: Implement entity search
			meta: {
				totalContents: contents.length,
				totalEntities: 0,
				query,
			},
		};
	}
}

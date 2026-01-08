// packages/shared/src/types/search.ts

/** 搜索请求 */
export interface SearchRequest {
	query: string;
	type?: "content" | "entity" | "all";
	filters?: SearchFilters;
	limit?: number;
}

/** 搜索过滤器 */
export interface SearchFilters {
	category?: string;
	tags?: string[];
	dateRange?: string; // "7d", "30d", "90d"
	sourceId?: string;
}

/** 搜索结果 */
export interface SearchResult {
	contents: ContentSearchResult[];
	entities: EntitySearchResult[];
	meta: {
		totalContents: number;
		totalEntities: number;
		query: string;
	};
}

/** 内容搜索结果（带相关性评分） */
export interface ContentSearchResult {
	id: string;
	title: string | null;
	summary: string | null;
	rank: number; // PostgreSQL ts_rank
}

/** 实体搜索结果 */
export interface EntitySearchResult {
	id: string;
	name: string;
	type: string;
	mentionCount: number;
}

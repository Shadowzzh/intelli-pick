import { api } from "@/lib/api";
import type { Content } from "@intellipick/db";
import type {
	CategoryStatsResponseData,
	ContentQueryParams,
	PaginatedResponse,
	PopularTagsQueryParams,
	PopularTagsResponseData,
	SourceStatsResponseData,
} from "@intellipick/shared";

export const contentsApi = {
	/**
	 * Fetch contents with filters
	 */
	async getContents(
		params: ContentQueryParams & { search?: string; entityIds?: string[] },
	): Promise<PaginatedResponse<Content>> {
		const queryParams: Record<string, string> = {};

		if (params.page) queryParams.page = params.page.toString();
		if (params.limit) queryParams.limit = params.limit.toString();
		if (params.date) queryParams.date = params.date;
		if (params.from) queryParams.from = params.from;
		if (params.to) queryParams.to = params.to;
		if (params.category) queryParams.category = params.category;
		if (params.search) queryParams.search = params.search;
		if (params.tags) {
			// tags 可能是字符串或数组
			queryParams.tags = Array.isArray(params.tags)
				? params.tags.join(",")
				: params.tags;
		}
		if (params.sourceIds?.length)
			queryParams.sourceId = params.sourceIds.join(",");
		if (params.entityIds?.length)
			queryParams.entityIds = params.entityIds.join(",");

		return api.getPaginated<Content>("/api/v1/contents", queryParams);
	},

	/**
	 * Fetch single content by ID
	 */
	async getContentById(id: string): Promise<Content> {
		return api.get<Content>(`/api/v1/contents/${id}`);
	},

	/**
	 * Fetch category statistics with filters
	 */
	async getCategoryStats(params?: {
		from?: string;
		to?: string;
		sourceIds?: string[];
		tags?: string[];
		entityIds?: string[];
	}): Promise<CategoryStatsResponseData> {
		const queryParams: Record<string, string> = {};
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;
		if (params?.sourceIds?.length)
			queryParams.sourceId = params.sourceIds.join(",");
		if (params?.tags?.length) queryParams.tags = params.tags.join(",");
		if (params?.entityIds?.length)
			queryParams.entityIds = params.entityIds.join(",");

		const queryString = new URLSearchParams(queryParams).toString();
		const url = queryString
			? `/api/v1/categories/stats?${queryString}`
			: "/api/v1/categories/stats";

		return api.get<CategoryStatsResponseData>(url);
	},

	/**
	 * Fetch popular tags with filters
	 */
	async getPopularTags(
		params?: PopularTagsQueryParams & {
			category?: string;
			sourceIds?: string[];
			entityIds?: string[];
		},
	): Promise<PopularTagsResponseData> {
		const queryParams: Record<string, string> = {};
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;
		if (params?.limit) queryParams.limit = params.limit.toString();
		if (params?.category) queryParams.category = params.category;
		if (params?.sourceIds?.length)
			queryParams.sourceId = params.sourceIds.join(",");
		if (params?.entityIds?.length)
			queryParams.entityIds = params.entityIds.join(",");

		const queryString = new URLSearchParams(queryParams).toString();
		const url = queryString
			? `/api/v1/tags/popular?${queryString}`
			: "/api/v1/tags/popular";

		return api.get<PopularTagsResponseData>(url);
	},

	/**
	 * Fetch source statistics with filters
	 */
	async getSourceStats(params?: {
		from?: string;
		to?: string;
		category?: string;
		tags?: string[];
		entityIds?: string[];
	}): Promise<SourceStatsResponseData> {
		const queryParams: Record<string, string> = {};
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;
		if (params?.category) queryParams.category = params.category;
		if (params?.tags?.length) queryParams.tags = params.tags.join(",");
		if (params?.entityIds?.length)
			queryParams.entityIds = params.entityIds.join(",");

		const queryString = new URLSearchParams(queryParams).toString();
		const url = queryString
			? `/api/v1/sources/stats?${queryString}`
			: "/api/v1/sources/stats";

		return api.get<SourceStatsResponseData>(url);
	},

	/**
	 * Query key factory for contents
	 */
	queryKeys: {
		all: ["contents"] as const,
		filtered: (params: ContentQueryParams) =>
			["contents", "filtered", params] as const,
		detail: (id: string) => ["contents", "detail", id] as const,
		categories: (params?: {
			from?: string;
			to?: string;
			sourceIds?: string[];
			tags?: string[];
			entityIds?: string[];
		}) => ["categories", "stats", params] as const,
		tags: (
			params?: PopularTagsQueryParams & {
				category?: string;
				sourceIds?: string[];
				entityIds?: string[];
			},
		) => ["tags", "popular", params] as const,
		sources: (params?: {
			from?: string;
			to?: string;
			category?: string;
			tags?: string[];
			entityIds?: string[];
		}) => ["sources", "stats", params] as const,
	},
};

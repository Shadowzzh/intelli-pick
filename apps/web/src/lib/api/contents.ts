import { api } from "@/lib/api";
import type { Content } from "@intellipick/db";
import type {
	CategoryStatsResponseData,
	ContentQueryParams,
	PaginatedResponse,
	PopularTagsQueryParams,
	PopularTagsResponseData,
} from "@intellipick/shared";

export const contentsApi = {
	/**
	 * Fetch contents with filters
	 */
	async getContents(
		params: ContentQueryParams & { search?: string },
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

		return api.getPaginated<Content>("/api/v1/contents", queryParams);
	},

	/**
	 * Fetch single content by ID
	 */
	async getContentById(id: string): Promise<Content> {
		return api.get<Content>(`/api/v1/contents/${id}`);
	},

	/**
	 * Fetch category statistics
	 */
	async getCategoryStats(params?: {
		from?: string;
		to?: string;
	}): Promise<CategoryStatsResponseData> {
		const queryParams: Record<string, string> = {};
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;

		const queryString = new URLSearchParams(queryParams).toString();
		const url = queryString
			? `/api/v1/categories/stats?${queryString}`
			: "/api/v1/categories/stats";

		return api.get<CategoryStatsResponseData>(url);
	},

	/**
	 * Fetch popular tags
	 */
	async getPopularTags(
		params?: PopularTagsQueryParams,
	): Promise<PopularTagsResponseData> {
		const queryParams: Record<string, string> = {};
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;
		if (params?.limit) queryParams.limit = params.limit.toString();

		const queryString = new URLSearchParams(queryParams).toString();
		const url = queryString
			? `/api/v1/tags/popular?${queryString}`
			: "/api/v1/tags/popular";

		return api.get<PopularTagsResponseData>(url);
	},

	/**
	 * Query key factory for contents
	 */
	queryKeys: {
		all: ["contents"] as const,
		filtered: (params: ContentQueryParams) =>
			["contents", "filtered", params] as const,
		detail: (id: string) => ["contents", "detail", id] as const,
		categories: (params?: { from?: string; to?: string }) =>
			["categories", "stats", params] as const,
		tags: (params?: PopularTagsQueryParams) =>
			["tags", "popular", params] as const,
	},
};

import { api } from "@/lib/api";
import type { Content } from "@intellipick/db";
import type { PaginatedResponse, PaginationParams } from "@intellipick/shared";

interface ContentQueryParams extends PaginationParams {
	date?: string;
	from?: string;
	to?: string;
	category?: string;
	tags?: string[];
	sourceIds?: string[];
}

export const contentsApi = {
	/**
	 * Fetch contents with filters
	 */
	async getContents(
		params: ContentQueryParams,
	): Promise<PaginatedResponse<Content>> {
		const queryParams: Record<string, string> = {};

		if (params.page) queryParams.page = params.page.toString();
		if (params.limit) queryParams.limit = params.limit.toString();
		if (params.date) queryParams.date = params.date;
		if (params.from) queryParams.from = params.from;
		if (params.to) queryParams.to = params.to;
		if (params.category) queryParams.category = params.category;
		if (params.tags?.length) queryParams.tags = params.tags.join(",");
		if (params.sourceIds?.length)
			queryParams.sourceId = params.sourceIds.join(",");

		return api.get<PaginatedResponse<Content>>("/api/v1/contents", {
			params: queryParams,
		});
	},

	/**
	 * Fetch single content by ID
	 */
	async getContentById(id: string): Promise<Content> {
		return api.get<Content>(`/api/v1/contents/${id}`);
	},

	/**
	 * Query key factory for contents
	 */
	queryKeys: {
		all: ["contents"] as const,
		filtered: (params: ContentQueryParams) =>
			["contents", "filtered", params] as const,
		detail: (id: string) => ["contents", "detail", id] as const,
	},
};

import { api } from "@/lib/api";
import type { PaginationParams } from "@intellipick/shared";

export interface Tag {
	name: string;
	count: number;
}

interface TagsResponse {
	tags: Tag[];
	total: string;
}

interface TagsQueryParams extends PaginationParams {
	from?: string;
	to?: string;
}

export const tagsApi = {
	/**
	 * Fetch popular tags
	 */
	async getPopular(params?: TagsQueryParams): Promise<Tag[]> {
		const queryParams: Record<string, string> = {};
		if (params?.limit) queryParams.limit = params.limit.toString();
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;

		const response = await api.get<TagsResponse>("/api/v1/tags/popular", {
			params: queryParams,
		});
		return response.tags;
	},

	/**
	 * Query key factory for tags
	 */
	queryKeys: {
		popular: (params?: TagsQueryParams) => ["tags", "popular", params] as const,
	},
};

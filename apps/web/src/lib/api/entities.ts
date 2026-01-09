import { api } from "@/lib/api";
import type { PaginatedResponse, PaginationParams } from "@intellipick/shared";

export interface Entity {
	id: string;
	name: string;
	type: "person" | "organization" | "product" | "location" | "event" | "other";
	mentionCount: number;
	firstSeenAt: string;
	lastSeenAt: string;
}

interface EntitiesQueryParams extends PaginationParams {
	type?: string;
	from?: string;
	to?: string;
}

export const entitiesApi = {
	/**
	 * Fetch trending entities
	 */
	async getTrending(
		params?: EntitiesQueryParams,
	): Promise<PaginatedResponse<Entity>> {
		const queryParams: Record<string, string> = {};
		if (params?.page) queryParams.page = params.page.toString();
		if (params?.limit) queryParams.limit = params.limit.toString();
		if (params?.type) queryParams.type = params.type;
		if (params?.from) queryParams.from = params.from;
		if (params?.to) queryParams.to = params.to;

		return api.get<PaginatedResponse<Entity>>("/api/v1/entities", {
			params: queryParams,
		});
	},

	/**
	 * Query key factory for entities
	 */
	queryKeys: {
		trending: (params?: EntitiesQueryParams) =>
			["entities", "trending", params] as const,
		detail: (id: string) => ["entities", "detail", id] as const,
	},
};

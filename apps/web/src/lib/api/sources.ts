import { api } from "@/lib/api";
import type { SourceStatus } from "@intellipick/shared";

export interface Source {
	id: string;
	name: string;
	type: string;
	enabled: boolean;
	fetchInterval: number;
	lastFetchedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export const sourcesApi = {
	/**
	 * Fetch all sources
	 */
	async getAll(): Promise<Source[]> {
		return api.get<Source[]>("/api/v1/sources");
	},

	async updateEnabled(id: string, enabled: boolean): Promise<SourceStatus> {
		return api.patch<SourceStatus>(`/api/v1/sources/${id}/enabled`, {
			enabled,
		});
	},

	/**
	 * Query key factory for sources
	 */
	queryKeys: {
		all: () => ["sources"] as const,
	},
};

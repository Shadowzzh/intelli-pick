import { api } from "@/lib/api";

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

	/**
	 * Query key factory for sources
	 */
	queryKeys: {
		all: () => ["sources"] as const,
	},
};

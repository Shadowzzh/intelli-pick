import { api } from "@/lib/api";
import type { JobRoleCategory, PaginatedResponse } from "@intellipick/shared";

export type JobRemoteType = "remote" | "hybrid" | "onsite" | "unknown";
export type JobTrackingStatus =
	| "new"
	| "not_interested"
	| "applied"
	| "interview"
	| "offer"
	| "rejected";

export interface JobTrackingPatch {
	status?: JobTrackingStatus;
	isFavorite?: boolean;
	notes?: string | null;
}

export interface JobPostingItem {
	id: string;
	sourceId: string;
	externalId: string;
	url: string;
	title: string;
	company: string | null;
	roleCategories: JobRoleCategory[];
	locations: string[];
	remoteType: JobRemoteType;
	employmentType: string | null;
	salaryText: string | null;
	experience: string | null;
	skills: string[];
	summary: string;
	requirements: string[];
	benefits: string[];
	application: string | null;
	publishedAt: string | null;
	collectedAt: string;
	createdAt: string;
	updatedAt: string;
	sourceName: string;
	isFavorite: boolean;
	trackingStatus: JobTrackingStatus;
	trackingNotes: string | null;
}

export interface JobSourceItem {
	id: string;
	key: string;
	name: string;
	type: string;
	url: string;
	enabled: boolean;
	fetchInterval: number;
	lastFetchedAt: string | null;
	lastFetchStatus: string | null;
	lastFetchError: string | null;
}

export interface JobsQueryParams {
	page: number;
	limit: number;
	search?: string;
	sourceId?: string;
	remoteType?: JobRemoteType;
	trackingStatus?: JobTrackingStatus;
	favorite?: boolean;
	roleCategory?: JobRoleCategory;
	skill?: string;
	sortOrder?: "asc" | "desc";
}

export interface JobFacetItem {
	name: string;
	count: number;
}

export interface JobFacets {
	roleCategories: JobFacetItem[];
	skills: JobFacetItem[];
}

export type JobFacetQueryParams = Omit<
	JobsQueryParams,
	"page" | "limit" | "sortOrder"
>;

export const jobsApi = {
	getJobs(params: JobsQueryParams): Promise<PaginatedResponse<JobPostingItem>> {
		return api.getPaginated<JobPostingItem>("/api/v1/jobs", { ...params });
	},

	getSources(): Promise<JobSourceItem[]> {
		return api.get<JobSourceItem[]>("/api/v1/jobs/sources");
	},

	getFacets(params: JobFacetQueryParams): Promise<JobFacets> {
		return api.get<JobFacets>("/api/v1/jobs/facets", { params });
	},

	updateTracking(
		postingId: string,
		patch: JobTrackingPatch,
	): Promise<{
		id: string;
		postingId: string;
		status: JobTrackingStatus;
		isFavorite: boolean;
	}> {
		return api.patch(`/api/v1/jobs/${postingId}/tracking`, patch);
	},

	queryKeys: {
		all: ["jobs"] as const,
		list: (params: JobsQueryParams) => ["jobs", "list", params] as const,
		sources: ["jobs", "sources"] as const,
		facets: (params: JobFacetQueryParams) =>
			["jobs", "facets", params] as const,
	},
};

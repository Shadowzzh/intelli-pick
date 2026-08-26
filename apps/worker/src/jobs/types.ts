export interface RawJobPosting {
	sourceId: string;
	sourceKey: string;
	externalId: string;
	url: string;
	title: string;
	author: string | null;
	content: string;
	publishedAt: string | null;
	collectedAt: string;
	rawData: Record<string, unknown>;
}

export interface JobProcessingResult {
	stored: boolean;
	postingId?: string;
	reason?: string;
}

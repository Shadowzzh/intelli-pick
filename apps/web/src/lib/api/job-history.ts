import type {
	JobHistoryRecord,
	JobHistoryStatus,
	PaginatedResponse,
} from "@intellipick/shared";
import { api } from "../api";

export async function getJobHistory(params: {
	page: number;
	limit: number;
	status?: JobHistoryStatus;
}): Promise<PaginatedResponse<JobHistoryRecord>> {
	return api.getPaginated<JobHistoryRecord>("/api/v1/job-history", params);
}

export async function getJobHistoryByJobId(
	jobId: string,
): Promise<JobHistoryRecord> {
	return api.get<JobHistoryRecord>(
		`/api/v1/job-history/job/${encodeURIComponent(jobId)}`,
	);
}

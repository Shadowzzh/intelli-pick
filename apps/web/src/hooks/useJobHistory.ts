import { getJobHistory } from "@/lib/api/job-history";
import type { JobHistoryStatus } from "@intellipick/shared";
import { useQuery } from "@tanstack/react-query";

export function useJobHistory(params: {
	page: number;
	limit: number;
	status?: JobHistoryStatus;
}) {
	return useQuery({
		queryKey: ["job-history", params],
		queryFn: () => getJobHistory(params),
		refetchInterval: 10_000,
	});
}

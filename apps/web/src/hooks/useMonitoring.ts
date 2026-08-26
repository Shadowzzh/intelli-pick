import { getMonitoringData } from "@/lib/api/monitoring";
import { sourcesApi } from "@/lib/api/sources";
// apps/web/src/hooks/useMonitoring.ts
import {
	type MonitoringData,
	SourceHealthStatus,
	type SourceHealthSummary,
} from "@intellipick/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const monitoringQueryKey = ["monitoring"] as const;

function calculateSourceSummary(data: MonitoringData): SourceHealthSummary {
	const summary: SourceHealthSummary = {
		total: data.sources.sources.length,
		healthy: 0,
		delayed: 0,
		error: 0,
		pending: 0,
		disabled: 0,
	};

	for (const source of data.sources.sources) {
		summary[source.healthStatus]++;
	}
	return summary;
}

/**
 * 获取监控数据的 hook
 */
export function useMonitoring() {
	return useQuery<MonitoringData>({
		queryKey: monitoringQueryKey,
		queryFn: getMonitoringData,
		refetchInterval: 10000, // 每 10 秒自动刷新
		staleTime: 5000, // 5 秒内认为数据是新鲜的
	});
}

export function useSourceEnabledMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
			sourcesApi.updateEnabled(id, enabled),
		onMutate: async ({ id, enabled }) => {
			await queryClient.cancelQueries({ queryKey: monitoringQueryKey });
			const previous =
				queryClient.getQueryData<MonitoringData>(monitoringQueryKey);

			queryClient.setQueryData<MonitoringData>(
				monitoringQueryKey,
				(current) => {
					if (!current) {
						return current;
					}

					const sources = current.sources.sources.map((source) => {
						if (source.id !== id) {
							return source;
						}

						return {
							...source,
							enabled,
							healthStatus: enabled
								? SourceHealthStatus.PENDING
								: SourceHealthStatus.DISABLED,
						};
					});
					const updated = {
						...current,
						sources: { ...current.sources, sources },
					};
					updated.sources.summary = calculateSourceSummary(updated);
					return updated;
				},
			);

			return { previous };
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(monitoringQueryKey, context.previous);
			}
		},
		onSettled: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: monitoringQueryKey }),
				queryClient.invalidateQueries({ queryKey: sourcesApi.queryKeys.all() }),
			]);
		},
	});
}

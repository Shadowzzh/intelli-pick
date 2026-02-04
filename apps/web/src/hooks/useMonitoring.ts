import { getMonitoringData } from "@/lib/api/monitoring";
// apps/web/src/hooks/useMonitoring.ts
import type { MonitoringData } from "@intellipick/shared";
import { useQuery } from "@tanstack/react-query";

/**
 * 获取监控数据的 hook
 */
export function useMonitoring() {
	return useQuery<MonitoringData>({
		queryKey: ["monitoring"],
		queryFn: getMonitoringData,
		refetchInterval: 10000, // 每 10 秒自动刷新
		staleTime: 5000, // 5 秒内认为数据是新鲜的
	});
}

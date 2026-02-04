// apps/web/src/lib/api/monitoring.ts
import type { MonitoringData } from "@intellipick/shared";
import { api } from "../api";

/**
 * 获取监控数据
 */
export async function getMonitoringData(): Promise<MonitoringData> {
	return api.get<MonitoringData>("/api/v1/monitoring");
}

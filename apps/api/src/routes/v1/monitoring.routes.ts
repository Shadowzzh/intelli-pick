import type { FastifyInstance } from "fastify";
import type { MonitoringService } from "../../services/monitoring.service";

export async function monitoringRoutes(
	app: FastifyInstance,
	service: MonitoringService,
) {
	app.get("/monitoring", async () => {
		const data = await service.getMonitoringData();
		return {
			success: true,
			data,
		};
	});
}

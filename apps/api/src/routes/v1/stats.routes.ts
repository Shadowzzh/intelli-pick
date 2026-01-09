import type { FastifyInstance } from "fastify";
import type { StatsService } from "../../services/stats.service";

export async function statsRoutes(app: FastifyInstance, service: StatsService) {
	app.get("/stats", async () => {
		const stats = await service.getStats();
		return {
			success: true,
			data: stats,
		};
	});
}

// apps/api/src/routes/v1/sources.routes.ts
import type { FastifyInstance } from "fastify";
import type { SourcesService } from "../../services/sources.service";

export async function sourcesRoutes(
	app: FastifyInstance,
	service: SourcesService,
) {
	// Get all sources
	app.get("/sources", async (req) => {
		const sources = await service.findAll();
		return {
			success: true,
			data: sources,
		};
	});

	// Get sources health status
	app.get("/sources/health", async (req) => {
		const result = await service.getHealthStatus();
		return result;
	});
}

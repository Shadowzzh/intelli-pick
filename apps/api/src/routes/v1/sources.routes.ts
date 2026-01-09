// apps/api/src/routes/v1/sources.routes.ts
import type { FastifyInstance } from "fastify";
import type { SourcesService } from "../../services/sources.service";

export async function sourcesRoutes(
	app: FastifyInstance,
	service: SourcesService,
) {
	// Get sources health status
	app.get("/sources/health", async (req) => {
		const result = await service.getHealthStatus();
		return result;
	});
}

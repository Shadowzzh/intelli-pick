// apps/api/src/routes/v1/sources.routes.ts
import type { FastifyInstance } from "fastify";
import { ValidationError } from "../../lib/errors";
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

	app.patch("/sources/:id/enabled", async (request) => {
		const params = request.params as { id?: unknown };
		const body = request.body as { enabled?: unknown } | null;
		if (
			typeof params.id !== "string" ||
			!body ||
			typeof body.enabled !== "boolean"
		) {
			throw new ValidationError("数据源启用状态格式不正确");
		}

		const source = await service.setEnabled(params.id, body.enabled);
		return { success: true, data: source };
	});
}

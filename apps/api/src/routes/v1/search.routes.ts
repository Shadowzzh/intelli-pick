// apps/api/src/routes/v1/search.routes.ts
import type { FastifyInstance } from "fastify";
import { SearchService } from "../../services/search.service.js";

export async function searchRoutes(
	app: FastifyInstance,
	service: SearchService,
) {
	app.post("/search", async (req, reply) => {
		const { query, limit = 20 } = req.body as {
			query: string;
			limit?: number;
		};

		if (!query || typeof query !== "string") {
			return reply.status(400).send({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Query is required",
				},
			});
		}

		const result = await service.search(query, limit);
		return reply.send({ success: true, data: result });
	});
}

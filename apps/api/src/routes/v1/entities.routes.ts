// apps/api/src/routes/v1/entities.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors.js";
import { EntitiesService } from "../../services/entities.service.js";
import { parsePagination } from "../../lib/validation.js";

export async function entitiesRoutes(
	app: FastifyInstance,
	service: EntitiesService,
) {
	// List trending entities
	app.get("/entities", async (req, reply) => {
		const { page, limit } = parsePagination(req.query as any);
		const result = await service.findTrending({ page, limit });
		return result;
	});

	// Get single entity
	app.get("/entities/:id", async (req, reply) => {
		const { id } = req.params as { id: string };
		const result = await service.findById(id);

		if (!result) {
			reply.code(404).send({
				success: false,
				error: {
					code: "NOT_FOUND",
					message: `Entity with id ${id} not found`,
				},
			});
			return;
		}

		return result;
	});
}

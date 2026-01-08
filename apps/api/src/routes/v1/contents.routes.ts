// apps/api/src/routes/v1/contents.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors.js";
import { parsePagination } from "../../lib/validation.js";
import type { ContentsService } from "../../services/contents.service.js";

export async function contentsRoutes(
	app: FastifyInstance,
	service: ContentsService,
) {
	// List contents
	app.get("/contents", async (req, reply) => {
		const { page, limit } = parsePagination(req.query as any);
		const filters = {
			category: (req.query as any).category,
			tags: (req.query as any).tags,
			sourceId: (req.query as any).sourceId,
		};

		const result = await service.findPaginated({ page, limit, filters });
		return result;
	});

	// Get single content
	app.get("/contents/:id", async (req, reply) => {
		const { id } = req.params as { id: string };
		const result = await service.findById(id);

		if (!result) {
			reply.code(404).send({
				success: false,
				error: {
					code: "NOT_FOUND",
					message: `Content with id ${id} not found`,
				},
			});
			return;
		}

		return result;
	});
}

import type { PaginationParams } from "@intellipick/shared";
// apps/api/src/routes/v1/contents.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors.js";
import { parsePagination } from "../../lib/validation.js";
import type { ContentsService } from "../../services/contents.service.js";

interface ContentQueryParams extends PaginationParams {
	category?: string;
	tags?: string;
	sourceId?: string;
}

export async function contentsRoutes(
	app: FastifyInstance,
	service: ContentsService,
) {
	// List contents
	app.get("/contents", async (req, reply) => {
		const { page, limit } = parsePagination(req.query as ContentQueryParams);
		const filters = {
			category: (req.query as ContentQueryParams).category,
			tags: (req.query as ContentQueryParams).tags,
			sourceId: (req.query as ContentQueryParams).sourceId,
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

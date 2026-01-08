import type { PaginationParams } from "@intellipick/shared";
// apps/api/src/routes/v1/contents.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors.js";
import { parsePagination } from "../../lib/validation.js";
import type { ContentsService } from "../../services/contents.service.js";

interface ContentQueryParams extends PaginationParams {
	category?: string;
	tags?: string | string[];
	sourceId?: string;
}

/**
 * 将 tags 查询参数转换为数组格式
 * 支持逗号分隔的字符串或数组
 */
function parseTags(tags: string | string[] | undefined): string[] | undefined {
	if (!tags) return undefined;
	if (Array.isArray(tags)) return tags;
	return tags.split(",").map((tag) => tag.trim());
}

export async function contentsRoutes(
	app: FastifyInstance,
	service: ContentsService,
) {
	// List contents
	app.get("/contents", async (req) => {
		const query = req.query as ContentQueryParams;
		const { page, limit } = parsePagination(query);

		const filters = {
			category: query.category,
			tags: parseTags(query.tags),
			sourceId: query.sourceId,
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

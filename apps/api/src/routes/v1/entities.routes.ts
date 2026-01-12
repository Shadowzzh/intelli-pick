import type { PaginationParams } from "@intellipick/shared";
// apps/api/src/routes/v1/entities.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors";
import { parsePagination } from "../../lib/validation";
import type { EntitiesService } from "../../services/entities.service";

interface EntitiesQueryParams extends PaginationParams {
	from?: string;
	to?: string;
	category?: string;
}

interface EntityContentsQueryParams extends PaginationParams {
	from?: string;
	to?: string;
}

/**
 * 解析日期查询参数
 */
function parseEntityDateRange(params: EntitiesQueryParams): {
	lastMentionedAfter?: Date;
	lastMentionedBefore?: Date;
} {
	const result: {
		lastMentionedAfter?: Date;
		lastMentionedBefore?: Date;
	} = {};

	if (params.from) {
		result.lastMentionedAfter = new Date(params.from);
	}

	if (params.to) {
		result.lastMentionedBefore = new Date(params.to);
	}

	return result;
}

/**
 * 解析实体内容日期查询参数
 */
function parseEntityContentsDateRange(params: EntityContentsQueryParams): {
	publishedAfter?: Date;
	publishedBefore?: Date;
} {
	const result: {
		publishedAfter?: Date;
		publishedBefore?: Date;
	} = {};

	if (params.from) {
		result.publishedAfter = new Date(params.from);
	}

	if (params.to) {
		result.publishedBefore = new Date(params.to);
	}

	return result;
}

export async function entitiesRoutes(
	app: FastifyInstance,
	service: EntitiesService,
) {
	// List trending entities
	app.get("/entities", async (req, reply) => {
		const query = req.query as EntitiesQueryParams;
		const { page, limit } = parsePagination(query);
		const dateRange = parseEntityDateRange(query);

		const result = await service.findTrending({
			page,
			limit,
			...dateRange,
			category: query.category,
		});
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

	// Get contents for an entity
	app.get("/entities/:id/contents", async (req, reply) => {
		const { id } = req.params as { id: string };
		const query = req.query as EntityContentsQueryParams;
		const { page, limit } = parsePagination(query);
		const dateRange = parseEntityContentsDateRange(query);

		const result = await service.findContentsByEntityId({
			entityId: id,
			page,
			limit,
			...dateRange,
		});

		return result;
	});
}

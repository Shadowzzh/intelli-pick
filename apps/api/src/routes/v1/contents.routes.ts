import type { ContentQueryParams } from "@intellipick/shared";
// apps/api/src/routes/v1/contents.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors";
import { parsePagination } from "../../lib/validation";
import type { ContentsService } from "../../services/contents.service";

interface DatesQueryParams {
	from?: string;
	to?: string;
}

interface TagsQueryParams extends DatesQueryParams {
	limit?: string;
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

/**
 * 解析日期查询参数
 */
function parseDateRange(params: DatesQueryParams): {
	from?: Date;
	to?: Date;
} {
	const result: { from?: Date; to?: Date } = {};

	if (params.from) {
		result.from = new Date(params.from);
	}

	if (params.to) {
		result.to = new Date(params.to);
	}

	return result;
}

/**
 * 解析标签查询参数（包含 limit）
 */
function parseTagsQueryParams(params: TagsQueryParams): {
	from?: Date;
	to?: Date;
	limit?: number;
} {
	const dateRange = parseDateRange(params);
	const limit = params.limit ? Number.parseInt(params.limit, 10) : undefined;

	return {
		...dateRange,
		limit,
	};
}

export async function contentsRoutes(
	app: FastifyInstance,
	service: ContentsService,
) {
	// List contents
	app.get("/contents", async (req) => {
		const query = req.query as ContentQueryParams & { search?: string };
		const { page, limit } = parsePagination(query);
		const dateRange = parseDateRange(query);

		const filters = {
			category: query.category,
			tags: parseTags(query.tags),
			sourceId: query.sourceId,
			publishedAfter: dateRange.from,
			publishedBefore: dateRange.to,
			search: query.search,
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

	// Get dates with content counts
	app.get("/contents/dates", async (req) => {
		const query = req.query as DatesQueryParams;
		const dateRange = parseDateRange(query);

		const result = await service.getDates(dateRange);
		return result;
	});

	// Get category statistics
	app.get("/categories/stats", async (req) => {
		const query = req.query as DatesQueryParams;
		const dateRange = parseDateRange(query);

		const result = await service.getCategoryStats(dateRange);
		return result;
	});

	// Get popular tags
	app.get("/tags/popular", async (req) => {
		const query = req.query as TagsQueryParams;
		const params = parseTagsQueryParams(query);

		const result = await service.getPopularTags(params);
		return result;
	});
}

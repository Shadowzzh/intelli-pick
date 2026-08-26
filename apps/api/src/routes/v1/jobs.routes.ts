import {
	JOB_ROLE_CATEGORIES,
	type PaginationParams,
} from "@intellipick/shared";
import type { FastifyInstance } from "fastify";
import { ValidationError } from "../../lib/errors";
import { parsePagination } from "../../lib/validation";
import type { JobPostingFilters } from "../../repositories/jobs.repository";
import type { JobsService } from "../../services/jobs.service";

const TRACKING_STATUSES = new Set([
	"new",
	"not_interested",
	"applied",
	"interview",
	"offer",
	"rejected",
]);

const REMOTE_TYPES = new Set(["remote", "hybrid", "onsite", "unknown"]);

interface FilterQuery {
	search?: string;
	sourceId?: string;
	remoteType?: string;
	trackingStatus?: string;
	favorite?: string;
	roleCategory?: string;
	skill?: string;
}

interface JobsQuery extends FilterQuery, PaginationParams {
	sortOrder?: string;
}

interface TrackingBody {
	status?: unknown;
	isFavorite?: unknown;
	notes?: unknown;
}

function validateFilterQuery(query: FilterQuery): void {
	if (query.remoteType && !REMOTE_TYPES.has(query.remoteType)) {
		throw new ValidationError("无效的远程类型");
	}
	if (query.trackingStatus && !TRACKING_STATUSES.has(query.trackingStatus)) {
		throw new ValidationError("无效的求职状态");
	}
	if (query.favorite && !["true", "false"].includes(query.favorite)) {
		throw new ValidationError("无效的收藏筛选");
	}
	if (
		query.roleCategory &&
		!JOB_ROLE_CATEGORIES.some((category) => category === query.roleCategory)
	) {
		throw new ValidationError("无效的岗位方向");
	}
	if (query.skill && query.skill.trim().length > 100) {
		throw new ValidationError("技术栈名称过长");
	}
}

function parseFilters(query: FilterQuery): JobPostingFilters {
	return {
		search: query.search?.trim() || undefined,
		sourceId: query.sourceId,
		remoteType: query.remoteType,
		trackingStatus: query.trackingStatus,
		favorite: query.favorite === "true" ? true : undefined,
		roleCategory: query.roleCategory,
		skill: query.skill?.trim() || undefined,
	};
}

export async function jobsRoutes(app: FastifyInstance, service: JobsService) {
	app.get("/jobs", async (request) => {
		const query = request.query as JobsQuery;
		const { page, limit } = parsePagination(query);
		validateFilterQuery(query);
		if (query.sortOrder && !["asc", "desc"].includes(query.sortOrder)) {
			throw new ValidationError("无效的时间排序");
		}

		return service.findPaginated({
			page,
			limit,
			filters: {
				...parseFilters(query),
				sortOrder: query.sortOrder as "asc" | "desc" | undefined,
			},
		});
	});

	app.get("/jobs/sources", async () => service.findSources());

	app.get("/jobs/facets", async (request) => {
		const query = request.query as FilterQuery;
		validateFilterQuery(query);
		return service.findFacets(parseFilters(query));
	});

	app.get("/jobs/:id", async (request) => {
		const { id } = request.params as { id: string };
		return service.findById(id);
	});

	app.patch("/jobs/:id/tracking", async (request) => {
		const { id } = request.params as { id: string };
		const body = request.body as TrackingBody | null;

		if (
			!body ||
			(body.status === undefined &&
				body.isFavorite === undefined &&
				body.notes === undefined)
		) {
			throw new ValidationError("至少提供一个跟踪字段");
		}
		if (
			body.status !== undefined &&
			(typeof body.status !== "string" || !TRACKING_STATUSES.has(body.status))
		) {
			throw new ValidationError("无效的求职状态");
		}
		if (body.isFavorite !== undefined && typeof body.isFavorite !== "boolean") {
			throw new ValidationError("收藏状态格式不正确");
		}
		if (
			body.notes !== undefined &&
			body.notes !== null &&
			typeof body.notes !== "string"
		) {
			throw new ValidationError("备注格式不正确");
		}
		if (typeof body.notes === "string" && body.notes.length > 5000) {
			throw new ValidationError("备注不能超过 5000 个字符");
		}
		let notes: string | null | undefined;
		if (typeof body.notes === "string") {
			notes = body.notes.trim();
		} else if (body.notes === null) {
			notes = null;
		}

		return service.updateTracking({
			postingId: id,
			status: typeof body.status === "string" ? body.status : undefined,
			isFavorite:
				typeof body.isFavorite === "boolean" ? body.isFavorite : undefined,
			notes,
		});
	});
}

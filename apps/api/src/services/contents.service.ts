// apps/api/src/services/contents.service.ts
import type { Database } from "@intellipick/db";
import type {
	PaginatedResponse,
	PaginationMeta,
} from "@intellipick/shared";
import { ContentsRepository } from "../repositories/contents.repository.js";

export class ContentsService {
	constructor(private contentsRepo: ContentsRepository) {}

	async findPaginated(params: {
		page: number;
		limit: number;
		filters?: {
			category?: string;
			tags?: string[];
			sourceId?: string;
			publishedAfter?: Date;
			publishedBefore?: Date;
		};
	}): Promise<PaginatedResponse<any>> {
		const offset = (params.page - 1) * params.limit;

		const [items, total] = await Promise.all([
			this.contentsRepo.findWithFilters({
				...params.filters,
				limit: params.limit,
				offset,
				orderBy: { column: "publishedAt", direction: "desc" },
			}),
			this.contentsRepo.countWithFilters(params.filters || {}),
		]);

		const meta: PaginationMeta = {
			total,
			page: params.page,
			limit: params.limit,
			totalPages: Math.ceil(total / params.limit),
		};

		return {
			success: true,
			data: items,
			meta,
		};
	}

	async findById(id: string) {
		const content = await this.contentsRepo.findById(id);

		if (!content) {
			return null;
		}

		return {
			success: true,
			data: content,
		};
	}
}

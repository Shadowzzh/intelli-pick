// apps/api/src/services/contents.service.ts
import type { Content, Database } from "@intellipick/db";
import type { PaginatedResponse, PaginationMeta } from "@intellipick/shared";
import type { ContentsRepository } from "../repositories/contents.repository.js";

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
	}): Promise<PaginatedResponse<Content>> {
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

	async getDates(params: { from?: Date; to?: Date }) {
		// Default to current month if no range provided
		if (!params.from && !params.to) {
			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

			params.from = firstDay;
			params.to = lastDay;
		}

		const results = await this.contentsRepo.findDatesWithCount(params);

		// Convert to the expected format
		const dates = results.map((r) => r.date);
		const counts: Record<string, number> = {};
		for (const result of results) {
			counts[result.date] = result.count;
		}

		return {
			success: true,
			data: {
				dates,
				counts,
			},
		};
	}

	async getCategoryStats(params: { from?: Date; to?: Date }) {
		const results = await this.contentsRepo.findCategoryStats(params);

		const total = results.reduce((sum, r) => sum + r.count, 0);

		return {
			success: true,
			data: {
				categories: results,
				total,
			},
		};
	}

	async getPopularTags(params: {
		from?: Date;
		to?: Date;
		limit?: number;
	}) {
		const results = await this.contentsRepo.findPopularTags(params);

		const total = results.reduce((sum, r) => sum + r.count, 0);

		return {
			success: true,
			data: {
				tags: results,
				total,
			},
		};
	}
}

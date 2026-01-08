// apps/api/src/services/entities.service.ts
import type { Database, Entity } from "@intellipick/db";
import type { PaginatedResponse, PaginationMeta } from "@intellipick/shared";
import type { EntitiesRepository } from "../repositories/entities.repository.js";

export class EntitiesService {
	constructor(private entitiesRepo: EntitiesRepository) {}

	async findTrending(params: {
		page: number;
		limit: number;
	}): Promise<PaginatedResponse<Entity>> {
		const offset = (params.page - 1) * params.limit;

		const [items, totalResult] = await Promise.all([
			this.entitiesRepo.findTrending({
				limit: params.limit,
				offset,
			}),
			this.entitiesRepo.count(),
		]);

		const meta: PaginationMeta = {
			total: totalResult,
			page: params.page,
			limit: params.limit,
			totalPages: Math.ceil(totalResult / params.limit),
		};

		return {
			success: true,
			data: items,
			meta,
		};
	}

	async findById(id: string) {
		const entity = await this.entitiesRepo.findById(id);

		if (!entity) {
			return null;
		}

		return {
			success: true,
			data: entity,
		};
	}

	async findByContentId(contentId: string) {
		return await this.entitiesRepo.findByContentId(contentId);
	}
}

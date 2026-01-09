// apps/api/src/services/entities.service.ts
import type { Database, Entity } from "@intellipick/db";
import type { PaginatedResponse, PaginationMeta } from "@intellipick/shared";
import type { EntitiesRepository } from "../repositories/entities.repository.js";

export class EntitiesService {
	constructor(private entitiesRepo: EntitiesRepository) {}

	async findTrending(params: {
		page: number;
		limit: number;
		lastMentionedAfter?: Date;
		lastMentionedBefore?: Date;
	}): Promise<PaginatedResponse<Entity>> {
		const offset = (params.page - 1) * params.limit;

		const [items, totalResult] = await Promise.all([
			this.entitiesRepo.findTrending({
				limit: params.limit,
				offset,
				lastMentionedAfter: params.lastMentionedAfter,
				lastMentionedBefore: params.lastMentionedBefore,
			}),
			this.entitiesRepo.count({
				lastMentionedAfter: params.lastMentionedAfter,
				lastMentionedBefore: params.lastMentionedBefore,
			}),
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

	async findContentsByEntityId(params: {
		entityId: string;
		page: number;
		limit: number;
		publishedAfter?: Date;
		publishedBefore?: Date;
	}) {
		const offset = (params.page - 1) * params.limit;

		const [items, total] = await Promise.all([
			this.entitiesRepo.findContentsByEntityId({
				entityId: params.entityId,
				limit: params.limit,
				offset,
				publishedAfter: params.publishedAfter,
				publishedBefore: params.publishedBefore,
			}),
			this.entitiesRepo.countContentsByEntityId({
				entityId: params.entityId,
				publishedAfter: params.publishedAfter,
				publishedBefore: params.publishedBefore,
			}),
		]);

		// Get entity info
		const entity = await this.entitiesRepo.findById(params.entityId);

		if (!entity) {
			return {
				success: false,
				error: {
					code: "NOT_FOUND",
					message: `Entity with id ${params.entityId} not found`,
				},
			};
		}

		return {
			success: true,
			data: {
				entity: {
					id: entity.id,
					name: entity.name,
					type: entity.type,
				},
				items,
				total,
				page: params.page,
				limit: params.limit,
			},
		};
	}
}

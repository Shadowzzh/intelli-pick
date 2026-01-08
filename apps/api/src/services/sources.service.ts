// apps/api/src/services/sources.service.ts
import type { Source } from "@intellipick/db";
import type { SourcesRepository } from "../repositories/sources.repository.js";

export class SourcesService {
	constructor(private sourcesRepo: SourcesRepository) {}

	async findById(id: string): Promise<Source | null> {
		return await this.sourcesRepo.findById(id);
	}

	async findAll(): Promise<Source[]> {
		return await this.sourcesRepo.findAll();
	}
}

import type { PaginatedResponse, PaginationMeta } from "@intellipick/shared";
import { NotFoundError } from "../lib/errors";
import type {
	JobPostingFilters,
	JobsRepository,
} from "../repositories/jobs.repository";

type JobListItem = Awaited<ReturnType<JobsRepository["findPaginated"]>>[number];

export class JobsService {
	constructor(private jobsRepo: JobsRepository) {}

	async findPaginated(params: {
		page: number;
		limit: number;
		filters: JobPostingFilters;
	}): Promise<PaginatedResponse<JobListItem>> {
		const offset = (params.page - 1) * params.limit;
		const [items, total] = await Promise.all([
			this.jobsRepo.findPaginated({
				filters: params.filters,
				limit: params.limit,
				offset,
			}),
			this.jobsRepo.count(params.filters),
		]);
		const meta: PaginationMeta = {
			total: String(total),
			page: params.page,
			limit: params.limit,
			totalPages: Math.ceil(total / params.limit),
		};

		return { success: true, data: items, meta };
	}

	async findById(id: string) {
		const posting = await this.jobsRepo.findById(id);
		if (!posting) {
			throw new NotFoundError("Job posting", id);
		}
		return { success: true, data: posting };
	}

	async findSources() {
		return { success: true, data: await this.jobsRepo.findSources() };
	}

	async findFacets(filters: JobPostingFilters) {
		return { success: true, data: await this.jobsRepo.findFacets(filters) };
	}

	async updateTracking(params: {
		postingId: string;
		status?: string;
		isFavorite?: boolean;
		notes?: string | null;
	}) {
		const posting = await this.jobsRepo.findById(params.postingId);
		if (!posting) {
			throw new NotFoundError("Job posting", params.postingId);
		}

		const tracking = await this.jobsRepo.upsertTracking(params);
		return { success: true, data: tracking };
	}
}

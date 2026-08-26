import {
	type Database,
	jobPostings,
	jobSources,
	jobTracking,
} from "@intellipick/db";
import {
	type SQL,
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	isNull,
	ne,
	or,
	sql,
} from "drizzle-orm";

export interface JobPostingFilters {
	search?: string;
	sourceId?: string;
	remoteType?: string;
	trackingStatus?: string;
	favorite?: boolean;
	roleCategory?: string;
	skill?: string;
	sortOrder?: "asc" | "desc";
}

export class JobsRepository {
	constructor(private db: Database) {}

	private buildConditions(filters: JobPostingFilters): SQL[] {
		const conditions: SQL[] = [eq(jobPostings.status, "active")];

		if (filters.sourceId) {
			conditions.push(eq(jobPostings.sourceId, filters.sourceId));
		}

		if (filters.remoteType) {
			conditions.push(eq(jobPostings.remoteType, filters.remoteType));
		}

		if (filters.trackingStatus === "new") {
			const newCondition = or(
				isNull(jobTracking.id),
				eq(jobTracking.status, "new"),
			);
			if (newCondition) {
				conditions.push(newCondition);
			}
		} else if (filters.trackingStatus) {
			conditions.push(eq(jobTracking.status, filters.trackingStatus));
		} else {
			const visibleCondition = or(
				isNull(jobTracking.id),
				ne(jobTracking.status, "not_interested"),
			);
			if (visibleCondition) {
				conditions.push(visibleCondition);
			}
		}

		if (filters.favorite) {
			conditions.push(eq(jobTracking.isFavorite, true));
		}

		if (filters.roleCategory) {
			conditions.push(
				sql`${jobPostings.roleCategories} @> ${JSON.stringify([filters.roleCategory])}::jsonb`,
			);
		}

		if (filters.skill) {
			conditions.push(
				sql`${jobPostings.skills} @> ${JSON.stringify([filters.skill])}::jsonb`,
			);
		}

		if (filters.search) {
			const pattern = `%${filters.search}%`;
			const searchCondition = or(
				ilike(jobPostings.title, pattern),
				ilike(jobPostings.company, pattern),
				ilike(jobPostings.summary, pattern),
				sql`EXISTS (
					SELECT 1
					FROM jsonb_array_elements_text(${jobPostings.skills}) AS skill
					WHERE skill ILIKE ${pattern}
				)`,
			);
			if (searchCondition) {
				conditions.push(searchCondition);
			}
		}

		return conditions;
	}

	private listSelection() {
		return {
			id: jobPostings.id,
			sourceId: jobPostings.sourceId,
			externalId: jobPostings.externalId,
			url: jobPostings.url,
			title: jobPostings.title,
			company: jobPostings.company,
			roleCategories: jobPostings.roleCategories,
			locations: jobPostings.locations,
			remoteType: jobPostings.remoteType,
			employmentType: jobPostings.employmentType,
			salaryText: jobPostings.salaryText,
			experience: jobPostings.experience,
			skills: jobPostings.skills,
			summary: jobPostings.summary,
			requirements: jobPostings.requirements,
			benefits: jobPostings.benefits,
			application: jobPostings.application,
			publishedAt: jobPostings.publishedAt,
			collectedAt: jobPostings.collectedAt,
			createdAt: jobPostings.createdAt,
			updatedAt: jobPostings.updatedAt,
			sourceName: jobSources.name,
			isFavorite: sql<boolean>`coalesce(${jobTracking.isFavorite}, false)`,
			trackingStatus: sql<string>`coalesce(${jobTracking.status}, 'new')`,
			trackingNotes: jobTracking.notes,
		};
	}

	private detailSelection() {
		return {
			...this.listSelection(),
			rawContent: jobPostings.rawContent,
		};
	}

	async findPaginated(params: {
		filters: JobPostingFilters;
		limit: number;
		offset: number;
	}) {
		const sortTime = sql`coalesce(${jobPostings.publishedAt}, ${jobPostings.collectedAt})`;
		let timeOrder = desc(sortTime);
		let idOrder = desc(jobPostings.id);
		if (params.filters.sortOrder === "asc") {
			timeOrder = asc(sortTime);
			idOrder = asc(jobPostings.id);
		}

		return this.db
			.select(this.listSelection())
			.from(jobPostings)
			.innerJoin(jobSources, eq(jobPostings.sourceId, jobSources.id))
			.leftJoin(jobTracking, eq(jobPostings.id, jobTracking.postingId))
			.where(and(...this.buildConditions(params.filters)))
			.orderBy(timeOrder, idOrder)
			.limit(params.limit)
			.offset(params.offset);
	}

	async count(filters: JobPostingFilters): Promise<number> {
		const [result] = await this.db
			.select({ count: count() })
			.from(jobPostings)
			.leftJoin(jobTracking, eq(jobPostings.id, jobTracking.postingId))
			.where(and(...this.buildConditions(filters)));
		return result.count;
	}

	async findById(id: string) {
		const [result] = await this.db
			.select(this.detailSelection())
			.from(jobPostings)
			.innerJoin(jobSources, eq(jobPostings.sourceId, jobSources.id))
			.leftJoin(jobTracking, eq(jobPostings.id, jobTracking.postingId))
			.where(eq(jobPostings.id, id))
			.limit(1);
		return result;
	}

	async findSources() {
		return this.db
			.select({
				id: jobSources.id,
				key: jobSources.key,
				name: jobSources.name,
				type: jobSources.type,
				url: jobSources.url,
				enabled: jobSources.enabled,
				fetchInterval: jobSources.fetchInterval,
				lastFetchedAt: jobSources.lastFetchedAt,
				lastFetchStatus: jobSources.lastFetchStatus,
				lastFetchError: jobSources.lastFetchError,
			})
			.from(jobSources)
			.orderBy(desc(jobSources.enabled), jobSources.name);
	}

	async findFacets(filters: JobPostingFilters) {
		const roleCategoryFilters = {
			...filters,
			roleCategory: undefined,
		};
		const skillFilters = {
			...filters,
			skill: undefined,
		};
		const [roleCategories, skills] = await Promise.all([
			this.db
				.select({
					name: sql<string>`jsonb_array_elements_text(${jobPostings.roleCategories})`,
					count: sql<number>`count(*)`.mapWith(Number),
				})
				.from(jobPostings)
				.leftJoin(jobTracking, eq(jobPostings.id, jobTracking.postingId))
				.where(and(...this.buildConditions(roleCategoryFilters)))
				.groupBy(sql`jsonb_array_elements_text(${jobPostings.roleCategories})`)
				.orderBy(desc(sql`count(*)`)),
			this.db
				.select({
					name: sql<string>`jsonb_array_elements_text(${jobPostings.skills})`,
					count: sql<number>`count(*)`.mapWith(Number),
				})
				.from(jobPostings)
				.leftJoin(jobTracking, eq(jobPostings.id, jobTracking.postingId))
				.where(and(...this.buildConditions(skillFilters)))
				.groupBy(sql`jsonb_array_elements_text(${jobPostings.skills})`)
				.orderBy(desc(sql`count(*)`)),
		]);

		return { roleCategories, skills };
	}

	async upsertTracking(params: {
		postingId: string;
		status?: string;
		isFavorite?: boolean;
		notes?: string | null;
	}) {
		const updateValues: {
			status?: string;
			isFavorite?: boolean;
			updatedAt: Date;
			notes?: string | null;
		} = {
			updatedAt: new Date(),
		};
		if (params.status !== undefined) {
			updateValues.status = params.status;
		}
		if (params.isFavorite !== undefined) {
			updateValues.isFavorite = params.isFavorite;
		}
		if (params.notes !== undefined) {
			updateValues.notes = params.notes;
		}

		const [tracking] = await this.db
			.insert(jobTracking)
			.values({
				postingId: params.postingId,
				status: params.status || "new",
				isFavorite: params.isFavorite ?? false,
				notes: params.notes,
			})
			.onConflictDoUpdate({
				target: jobTracking.postingId,
				set: updateValues,
			})
			.returning();
		return tracking;
	}
}

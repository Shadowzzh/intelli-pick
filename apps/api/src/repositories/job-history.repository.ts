// apps/api/src/repositories/job-history.repository.ts
import type { Database } from "@intellipick/db";
import { jobHistory } from "@intellipick/db";
import { type SQL, and, desc, eq, gte, lte, sql } from "drizzle-orm";

export class JobHistoryRepository {
	constructor(private db: Database) {}

	/**
	 * 构建任务历史查询条件
	 */
	private buildFilters(filters: {
		status?: string;
		sourceType?: string;
		success?: boolean;
		startDate?: Date;
		endDate?: Date;
	}): SQL[] {
		const conditions: SQL[] = [];

		if (filters.status) {
			conditions.push(eq(jobHistory.status, filters.status));
		}

		if (filters.sourceType) {
			conditions.push(eq(jobHistory.sourceType, filters.sourceType));
		}

		if (filters.success !== undefined) {
			conditions.push(eq(jobHistory.success, filters.success));
		}

		if (filters.startDate) {
			conditions.push(gte(jobHistory.finishedAt, filters.startDate));
		}

		if (filters.endDate) {
			conditions.push(lte(jobHistory.finishedAt, filters.endDate));
		}

		return conditions;
	}

	/**
	 * 根据 ID 查询单个任务历史
	 */
	async findById(id: number) {
		const [result] = await this.db
			.select()
			.from(jobHistory)
			.where(eq(jobHistory.id, id))
			.limit(1);
		return result;
	}

	/**
	 * 根据 jobId 查询任务历史
	 */
	async findByJobId(jobId: string) {
		const [result] = await this.db
			.select()
			.from(jobHistory)
			.where(eq(jobHistory.jobId, jobId))
			.orderBy(desc(jobHistory.finishedAt))
			.limit(1);
		return result;
	}

	/**
	 * 查询任务历史列表（带分页和筛选）
	 */
	async findWithFilters(
		filters: {
			status?: string;
			sourceType?: string;
			success?: boolean;
			startDate?: Date;
			endDate?: Date;
		},
		page = 0,
		pageSize = 50,
	) {
		const conditions = this.buildFilters(filters);
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const results = await this.db
			.select()
			.from(jobHistory)
			.where(whereClause)
			.orderBy(desc(jobHistory.finishedAt))
			.limit(pageSize)
			.offset(page * pageSize);

		return results;
	}

	/**
	 * 统计任务数量
	 */
	async count(filters: {
		status?: string;
		sourceType?: string;
		success?: boolean;
		startDate?: Date;
		endDate?: Date;
	}) {
		const conditions = this.buildFilters(filters);
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [result] = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(jobHistory)
			.where(whereClause);

		return result?.count || 0;
	}

	/**
	 * 获取统计信息
	 */
	async getStats(filters: {
		startDate?: Date;
		endDate?: Date;
	}) {
		const conditions: SQL[] = [];

		if (filters.startDate) {
			conditions.push(gte(jobHistory.finishedAt, filters.startDate));
		}

		if (filters.endDate) {
			conditions.push(lte(jobHistory.finishedAt, filters.endDate));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [result] = await this.db
			.select({
				total: sql<number>`count(*)::int`,
				completed: sql<number>`count(*) FILTER (WHERE ${jobHistory.status} = 'completed')::int`,
				failed: sql<number>`count(*) FILTER (WHERE ${jobHistory.status} = 'failed')::int`,
				successful: sql<number>`count(*) FILTER (WHERE ${jobHistory.success} = true)::int`,
				avgDuration: sql<number>`avg(${jobHistory.duration})::int`,
			})
			.from(jobHistory)
			.where(whereClause);

		return (
			result || {
				total: 0,
				completed: 0,
				failed: 0,
				successful: 0,
				avgDuration: 0,
			}
		);
	}

	/**
	 * 查询指定时间之后可用于 AI 指标聚合的任务结果
	 */
	async findAiMetricReturnValues(startDate: Date) {
		return this.db
			.select({ returnValue: jobHistory.returnValue })
			.from(jobHistory)
			.where(gte(jobHistory.finishedAt, startDate));
	}
}

// apps/api/src/services/job-history.service.ts
import type { JobHistory } from "@intellipick/db";
import type {
	AiCallMetric,
	AiMetricProtocol,
	AiPerformanceMetrics,
	AiTaskPerformanceMetrics,
	JobHistoryRecord,
	JobHistoryStats,
	PaginatedResponse,
	PaginationMeta,
} from "@intellipick/shared";
import type { JobHistoryRepository } from "../repositories/job-history.repository";

function toJobHistoryRecord(job: JobHistory): JobHistoryRecord {
	return {
		id: job.id,
		jobId: job.jobId,
		jobName: job.jobName,
		sourceType: job.sourceType,
		url: job.url,
		externalId: job.externalId,
		status: job.status as JobHistoryRecord["status"],
		success: job.success,
		startedAt: job.startedAt.toISOString(),
		finishedAt: job.finishedAt.toISOString(),
		duration: job.duration,
		failedReason: job.failedReason,
		stacktrace: job.stacktrace,
		returnValue: job.returnValue,
		createdAt: job.createdAt.toISOString(),
	};
}

interface AiMetricAccumulator {
	calls: number;
	successes: number;
	durationMs: number;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	cachedPromptTokens: number;
	reasoningTokens: number;
	providers: Set<string>;
	protocols: Set<AiMetricProtocol>;
	configuredModels: Set<string>;
	responseModels: Set<string>;
}

function createAiMetricAccumulator(): AiMetricAccumulator {
	return {
		calls: 0,
		successes: 0,
		durationMs: 0,
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
		cachedPromptTokens: 0,
		reasoningTokens: 0,
		providers: new Set(),
		protocols: new Set(),
		configuredModels: new Set(),
		responseModels: new Set(),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function readAiCallMetric(value: unknown): AiCallMetric | null {
	if (!isRecord(value)) {
		return null;
	}

	if (
		typeof value.task !== "string" ||
		typeof value.provider !== "string" ||
		typeof value.protocol !== "string" ||
		typeof value.configuredModel !== "string" ||
		typeof value.success !== "boolean" ||
		typeof value.durationMs !== "number"
	) {
		return null;
	}

	return value as unknown as AiCallMetric;
}

function addAiCallMetric(
	accumulator: AiMetricAccumulator,
	metric: AiCallMetric,
): void {
	accumulator.calls++;
	if (metric.success) {
		accumulator.successes++;
	}
	accumulator.durationMs += metric.durationMs;
	accumulator.promptTokens += metric.promptTokens ?? 0;
	accumulator.completionTokens += metric.completionTokens ?? 0;
	accumulator.totalTokens += metric.totalTokens ?? 0;
	accumulator.cachedPromptTokens += metric.cachedPromptTokens ?? 0;
	accumulator.reasoningTokens += metric.reasoningTokens ?? 0;
	accumulator.providers.add(metric.provider);
	accumulator.protocols.add(metric.protocol);
	accumulator.configuredModels.add(metric.configuredModel);
	if (metric.responseModel) {
		accumulator.responseModels.add(metric.responseModel);
	}
}

function toAiTaskPerformanceMetrics(
	accumulator: AiMetricAccumulator,
): AiTaskPerformanceMetrics {
	let successRate: number | null = null;
	let avgResponseTime: number | null = null;
	if (accumulator.calls > 0) {
		successRate = accumulator.successes / accumulator.calls;
		avgResponseTime = accumulator.durationMs / accumulator.calls;
	}

	return {
		calls: accumulator.calls,
		successRate,
		avgResponseTime,
		promptTokens: accumulator.promptTokens,
		completionTokens: accumulator.completionTokens,
		totalTokens: accumulator.totalTokens,
		cachedPromptTokens: accumulator.cachedPromptTokens,
		reasoningTokens: accumulator.reasoningTokens,
		providers: [...accumulator.providers].sort(),
		protocols: [...accumulator.protocols].sort(),
		configuredModels: [...accumulator.configuredModels].sort(),
		responseModels: [...accumulator.responseModels].sort(),
	};
}

export function aggregateAiPerformance(
	returnValues: unknown[],
	windowHours: number,
): AiPerformanceMetrics {
	const filterAccumulator = createAiMetricAccumulator();
	const extractAccumulator = createAiMetricAccumulator();
	let filterPasses = 0;

	for (const returnValue of returnValues) {
		if (!isRecord(returnValue) || !isRecord(returnValue.aiMetrics)) {
			continue;
		}

		const filterMetric = readAiCallMetric(returnValue.aiMetrics.filter);
		if (filterMetric) {
			addAiCallMetric(filterAccumulator, filterMetric);
			if (filterMetric.success && filterMetric.decision === "pass") {
				filterPasses++;
			}
		}

		const extractMetric = readAiCallMetric(returnValue.aiMetrics.extract);
		if (extractMetric) {
			addAiCallMetric(extractAccumulator, extractMetric);
		}
	}

	const filter = toAiTaskPerformanceMetrics(filterAccumulator);
	const extract = toAiTaskPerformanceMetrics(extractAccumulator);
	let passRate: number | null = null;
	if (filterAccumulator.successes > 0) {
		passRate = filterPasses / filterAccumulator.successes;
	}

	const totalCalls = filterAccumulator.calls + extractAccumulator.calls;
	const totalDurationMs =
		filterAccumulator.durationMs + extractAccumulator.durationMs;
	let avgResponseTime: number | null = null;
	if (totalCalls > 0) {
		avgResponseTime = totalDurationMs / totalCalls;
	}

	return {
		windowHours,
		filter: { ...filter, passRate },
		extract,
		avgResponseTime,
		totalTokens: filter.totalTokens + extract.totalTokens,
	};
}

export class JobHistoryService {
	constructor(private jobHistoryRepo: JobHistoryRepository) {}

	/**
	 * 分页查询任务历史
	 */
	async findPaginated(params: {
		page: number;
		limit: number;
		filters?: {
			status?: string;
			sourceType?: string;
			success?: boolean;
			startDate?: Date;
			endDate?: Date;
		};
	}): Promise<PaginatedResponse<JobHistoryRecord>> {
		const [items, total] = await Promise.all([
			this.jobHistoryRepo.findWithFilters(
				params.filters || {},
				params.page - 1,
				params.limit,
			),
			this.jobHistoryRepo.count(params.filters || {}),
		]);

		const meta: PaginationMeta = {
			total: String(total),
			page: params.page,
			limit: params.limit,
			totalPages: Math.ceil(total / params.limit),
		};

		return {
			success: true,
			data: items.map(toJobHistoryRecord),
			meta,
		};
	}

	/**
	 * 根据 ID 查询单个任务历史
	 */
	async findById(id: number) {
		const jobHistory = await this.jobHistoryRepo.findById(id);
		if (!jobHistory) {
			return { success: false, error: "Job history not found" };
		}
		return { success: true, data: toJobHistoryRecord(jobHistory) };
	}

	/**
	 * 根据 jobId 查询任务历史
	 */
	async findByJobId(jobId: string) {
		const jobHistory = await this.jobHistoryRepo.findByJobId(jobId);
		if (!jobHistory) {
			return { success: false, error: "Job history not found" };
		}
		return { success: true, data: toJobHistoryRecord(jobHistory) };
	}

	/**
	 * 获取统计信息
	 */
	async getStats(filters?: { startDate?: Date; endDate?: Date }) {
		const stats = await this.jobHistoryRepo.getStats(filters || {});
		return { success: true, data: stats as JobHistoryStats };
	}

	/**
	 * 聚合最近时间窗口内的 AI 调用指标
	 */
	async getAiPerformance(windowHours = 24): Promise<AiPerformanceMetrics> {
		const startDate = new Date(Date.now() - windowHours * 60 * 60 * 1000);
		const rows = await this.jobHistoryRepo.findAiMetricReturnValues(startDate);
		return aggregateAiPerformance(
			rows.map((row) => row.returnValue),
			windowHours,
		);
	}
}

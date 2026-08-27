// packages/shared/src/types/api-types.ts
/**
 * API 接口类型定义
 *
 * 包含所有 REST API 的请求和响应类型定义
 */

import type { PaginatedResponse } from "./api.js";
import type { PaginationParams } from "./pagination.js";

// ============================================================================
// Contents API Types
// ============================================================================

/** 内容查询参数 */
export interface ContentQueryParams extends PaginationParams {
	date?: string;
	from?: string;
	to?: string;
	category?: string;
	tags?: string | string[];
	sourceIds?: string[];
	sourceId?: string;
}

/** 日期列表查询参数 */
export interface DatesQueryParams {
	from?: string;
	to?: string;
}

/** 日期列表响应数据 */
export interface DatesResponseData {
	dates: string[];
	counts: Record<string, number>;
}

/** 日期列表响应类型 */
export type DatesResponse = PaginatedResponse<DatesResponseData>;

/** 分类统计数据 */
export interface CategoryStats {
	name: string;
	count: number;
	latestUpdate: Date;
}

/** 分类统计响应数据 */
export interface CategoryStatsResponseData {
	categories: CategoryStats[];
	total: number;
}

/** 分类统计响应类型 */
export type CategoryStatsResponse =
	PaginatedResponse<CategoryStatsResponseData>;

/** 热门标签数据 */
export interface PopularTag {
	name: string;
	count: number;
}

/** 热门标签查询参数 */
export interface PopularTagsQueryParams extends DatesQueryParams {
	limit?: number;
}

/** 热门标签响应数据 */
export interface PopularTagsResponseData {
	tags: PopularTag[];
	total: number;
}

/** 热门标签响应类型 */
export type PopularTagsResponse = PaginatedResponse<PopularTagsResponseData>;

/** 数据源统计数据 */
export interface SourceStats {
	id: string;
	name: string;
	type: string;
	count: number;
}

/** 数据源统计响应数据 */
export interface SourceStatsResponseData {
	sources: SourceStats[];
	total: number;
}

/** 数据源统计响应类型 */
export type SourceStatsResponse = PaginatedResponse<SourceStatsResponseData>;

// ============================================================================
// Entities API Types
// ============================================================================

/** 实体查询参数 */
export interface EntitiesQueryParams {
	page?: number;
	limit?: number;
	from?: string;
	to?: string;
}

/** 实体相关内容查询参数 */
export interface EntityContentsQueryParams {
	page?: number;
	limit?: number;
	from?: string;
	to?: string;
}

/** 实体简要信息 */
export interface EntityBasicInfo {
	id: string;
	name: string;
	type: string;
}

/** 实体相关内容数据 */
export interface EntityContent {
	id: string;
	title: string;
	summary: string;
	url: string;
	author: string;
	publishedAt: Date;
	collectedAt: Date;
	category: string;
	tags: string[];
}

/** 实体相关内容响应数据 */
export interface EntityContentsResponseData {
	entity: EntityBasicInfo;
	items: EntityContent[];
	total: number;
	page: number;
	limit: number;
}

/** 实体相关内容响应类型 */
export type EntityContentsResponse =
	PaginatedResponse<EntityContentsResponseData>;

// ============================================================================
// Sources API Types
// ============================================================================

/** 数据源健康状态枚举 */
export enum SourceHealthStatus {
	HEALTHY = "healthy",
	DELAYED = "delayed",
	ERROR = "error",
	PENDING = "pending",
	DISABLED = "disabled",
}

export type SourceFetchStatus = "never" | "running" | "success" | "failed";

/** 数据源状态信息 */
export interface SourceStatus {
	id: string;
	name: string;
	type: string;
	url?: string;
	enabled: boolean;
	isConfigured: boolean;
	fetchInterval: number;
	scheduleMinute: number;
	lastAttemptedAt: Date | null;
	lastFetchedAt: Date | null;
	lastCollectedAt?: Date | null;
	lastFetchStatus: SourceFetchStatus;
	lastFetchError: string | null;
	lastItemCount: number | null;
	lastNewCount: number | null;
	lastDurationMs: number | null;
	healthStatus: SourceHealthStatus;
	nextFetchAt: Date | null;
}

/** 数据源健康统计 */
export interface SourceHealthSummary {
	total: number;
	healthy: number;
	delayed: number;
	error: number;
	pending: number;
	disabled: number;
}

/** 数据源健康响应数据 */
export interface SourceHealthResponseData {
	sources: SourceStatus[];
	summary: SourceHealthSummary;
}

/** 数据源健康响应类型 */
export type SourceHealthResponse = PaginatedResponse<SourceHealthResponseData>;

// ============================================================================
// Queue API Types
// ============================================================================

/** 队列指标 */
export interface QueueMetrics {
	name: string;
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
}

/** Worker 统计 */
export interface WorkerStats {
	active: number;
	total: number;
}

/** 队列状态响应数据 */
export interface QueueStatsResponseData {
	queues: QueueMetrics[];
	workers: WorkerStats;
}

/** 队列状态响应类型 */
export type QueueStatsResponse = PaginatedResponse<QueueStatsResponseData>;

/** 队列任务状态 */
export type JobStatus =
	| "waiting"
	| "active"
	| "completed"
	| "failed"
	| "delayed";

/** 队列任务筛选状态 */
export type QueueJobFilter = JobStatus | "all";

/** 队列任务基本信息 */
export interface QueueJob {
	id: string | undefined;
	name: string | undefined;
	data: unknown;
	progress: number | object;
	attemptsMade: number;
	timestamp: number | undefined;
	processedOn: number | undefined;
	finishedOn: number | undefined;
	failedReason?: string;
	stacktrace?: string[];
	returnvalue: unknown;
}

/** 队列任务详细信息 */
export interface QueueJobDetail extends QueueJob {
	opts: unknown;
}

/** 队列处理速率统计 */
export interface ProcessingRateStats {
	completedPerMinute: number;
	failedPerMinute: number;
	avgProcessingTime: number;
}

/** 持久化任务历史状态 */
export type JobHistoryStatus = "completed" | "failed";

/** 持久化任务历史记录 */
export interface JobHistoryRecord {
	id: number;
	jobId: string;
	jobName: string;
	sourceType: string | null;
	url: string | null;
	externalId: string | null;
	status: JobHistoryStatus;
	success: boolean | null;
	startedAt: string;
	finishedAt: string;
	duration: number | null;
	failedReason: string | null;
	stacktrace: string | null;
	returnValue: unknown;
	createdAt: string;
}

/** 任务历史统计 */
export interface JobHistoryStats {
	total: number;
	completed: number;
	failed: number;
	successful: number;
	avgDuration: number | null;
}

// ============================================================================
// Monitoring API Types
// ============================================================================

/** 系统概览统计 */
export interface SystemOverview {
	totalContents: number;
	totalEntities: number;
	activeSources: number;
	todayNew: number;
	queueWaiting: number;
	queueActive: number;
	systemStatus: "healthy" | "warning" | "error";
}

export type AiMetricTask = "filter" | "extractAndClassify";

export type AiMetricProtocol = "responses" | "chat-completions" | "anthropic";

export type AiFilterDecision = "pass" | "reject" | "quarantine";

/** 单次 AI 调用指标 */
export interface AiCallMetric {
	task: AiMetricTask;
	provider: string;
	protocol: AiMetricProtocol;
	configuredModel: string;
	responseModel: string | null;
	success: boolean;
	durationMs: number;
	promptTokens: number | null;
	completionTokens: number | null;
	totalTokens: number | null;
	cachedPromptTokens: number | null;
	reasoningTokens: number | null;
	finishReason: string | null;
	decision: AiFilterDecision | null;
}

/** 单次内容处理中的 AI 调用指标 */
export interface PipelineAiMetrics {
	filter?: AiCallMetric;
	extract?: AiCallMetric;
}

/** Worker 写入任务历史的处理结果 */
export interface PipelineJobResult {
	success: boolean;
	aiMetrics: PipelineAiMetrics;
}

/** 单个 AI 任务在时间窗口内的聚合指标 */
export interface AiTaskPerformanceMetrics {
	calls: number;
	successRate: number | null;
	avgResponseTime: number | null;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	cachedPromptTokens: number;
	reasoningTokens: number;
	providers: string[];
	protocols: AiMetricProtocol[];
	configuredModels: string[];
	responseModels: string[];
}

/** AI 处理性能指标 */
export interface AiPerformanceMetrics {
	windowHours: number;
	filter: AiTaskPerformanceMetrics & {
		passRate: number | null;
	};
	extract: AiTaskPerformanceMetrics;
	avgResponseTime: number | null;
	totalTokens: number;
}

/** 系统资源使用情况 */
export interface SystemResourceMetrics {
	database: {
		status: "connected" | "disconnected";
		connectionCount?: number;
	};
	redis: {
		status: "connected" | "disconnected";
		memoryUsage?: number;
		memoryLimit?: number;
	};
	api: {
		windowMinutes: number;
		requestCount: number;
		avgResponseTime: number;
		errorRate: number;
	};
}

/** 监控数据聚合 */
export interface MonitoringData {
	overview: SystemOverview;
	queue: QueueStatsResponseData;
	sources: SourceHealthResponseData;
	aiPerformance: AiPerformanceMetrics;
	systemResources: SystemResourceMetrics;
	timestamp: string;
}

/** 监控数据响应类型 */
export type MonitoringResponse = PaginatedResponse<MonitoringData>;

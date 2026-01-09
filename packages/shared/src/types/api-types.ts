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
	DISABLED = "disabled",
}

/** 数据源状态信息 */
export interface SourceStatus {
	id: string;
	name: string;
	type: string;
	enabled: boolean;
	fetchInterval: number;
	lastFetchedAt: Date | null;
	lastFetchStatus: string;
	healthStatus: SourceHealthStatus;
	nextFetchAt: Date | null;
}

/** 数据源健康统计 */
export interface SourceHealthSummary {
	total: number;
	healthy: number;
	delayed: number;
	error: number;
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

// packages/shared/src/types/api.ts

/** 成功的 API 响应 */
export interface ApiResponse<T> {
	success: true;
	data: T;
}

/** 带分页的列表响应 */
export interface PaginatedResponse<T> {
	success: true;
	data: T[];
	meta: PaginationMeta;
}

/** 分页元数据 */
export interface PaginationMeta {
	total: string;
	page: number;
	limit: number;
	totalPages: number;
}

/** 错误响应 */
export interface ApiError {
	success: false;
	error: ErrorDetail;
}

/** 错误详情 */
export interface ErrorDetail {
	code: ErrorCode;
	message: string;
	details?: unknown;
}

/** 错误码枚举 */
export enum ErrorCode {
	NOT_FOUND = "NOT_FOUND",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	INTERNAL_ERROR = "INTERNAL_ERROR",
	UNAUTHORIZED = "UNAUTHORIZED",
	RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

/** 联合类型：成功或失败 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** 类型守卫：判断是否成功 */
export function isSuccess<T>(result: ApiResult<T>): result is ApiResponse<T> {
	return result.success === true;
}

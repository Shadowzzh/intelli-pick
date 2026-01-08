/**
 * Twitter API 错误类型定义和辅助函数
 */

/**
 * Twitter API 响应错误结构
 */
export interface TwitterApiError {
	code?: number;
	statusCode?: number;
	data?: unknown;
	headers?: Record<string, string>;
	message?: string;
	name?: string;
}

/**
 * 任何可能的错误类型
 */
export type PossibleError = unknown;

/**
 * 类型守卫：检查错误是否是 TwitterApiError
 */
export function isTwitterApiError(err: PossibleError): err is TwitterApiError {
	if (typeof err !== "object" || err === null) {
		return false;
	}

	const error = err as Partial<TwitterApiError>;
	return (
		typeof error.code === "number" ||
		typeof error.statusCode === "number" ||
		typeof error.message === "string" ||
		typeof error.name === "string"
	);
}

/**
 * 检查是否是 429 Rate Limit 错误
 */
export function isRateLimitError(err: PossibleError): boolean {
	if (!isTwitterApiError(err)) {
		return false;
	}

	return err.code === 429 || err.statusCode === 429;
}

/**
 * 安全地从错误中提取信息
 */
export function extractErrorInfo(err: PossibleError) {
	if (!isTwitterApiError(err)) {
		return {
			errorCode: undefined,
			errorStatus: undefined,
			errorData: undefined,
			errorHeaders: undefined,
			errorMessage: err instanceof Error ? err.message : String(err),
			errorName: err instanceof Error ? err.name : undefined,
		};
	}

	return {
		errorCode: err.code,
		errorStatus: err.statusCode,
		errorData: err.data,
		errorHeaders: err.headers,
		errorMessage: err.message,
		errorName: err.name,
	};
}

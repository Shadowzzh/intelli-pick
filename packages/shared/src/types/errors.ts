// packages/shared/src/types/errors.ts

import type { ApiError, ErrorCode } from "./api.js";

/** API 请求错误类 */
export class ApiRequestError extends Error {
	public readonly code: ErrorCode;
	public readonly statusCode?: number;
	public readonly details?: unknown;

	constructor(error: ApiError) {
		super(error.error.message);
		this.name = "ApiRequestError";
		this.code = error.error.code;
		this.details = error.error.details;
	}
}

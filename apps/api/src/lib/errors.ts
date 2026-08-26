// apps/api/src/lib/errors.ts
import { ErrorCode } from "@intellipick/shared";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export class ApiError extends Error {
	constructor(
		public code: ErrorCode,
		message: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}

	// 将业务错误码映射为对应的 HTTP 状态码
	get statusCode(): number {
		if (this.code === ErrorCode.NOT_FOUND) return 404;
		if (this.code === ErrorCode.VALIDATION_ERROR) return 400;
		if (this.code === ErrorCode.UNAUTHORIZED) return 401;
		if (this.code === ErrorCode.RATE_LIMIT_EXCEEDED) return 429;
		return 500;
	}
}

export class NotFoundError extends ApiError {
	constructor(resource: string, id: string) {
		super(ErrorCode.NOT_FOUND, `${resource} with id ${id} not found`);
	}
}

export class ValidationError extends ApiError {
	constructor(message: string, details?: unknown) {
		super(ErrorCode.VALIDATION_ERROR, message, details);
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message = "请先登录") {
		super(ErrorCode.UNAUTHORIZED, message);
	}
}

export function handleError(
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// 处理 CORS 等 reply 尚未完全初始化时产生的早期错误
	if (typeof reply.code !== "function") {
		request.log.error(error);
		return;
	}

	if (error instanceof ApiError) {
		reply.code(error.statusCode).send({
			success: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
			},
		});
		return;
	}

	if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
		let code = ErrorCode.VALIDATION_ERROR;
		if (error.statusCode === 401) {
			code = ErrorCode.UNAUTHORIZED;
		} else if (error.statusCode === 404) {
			code = ErrorCode.NOT_FOUND;
		} else if (error.statusCode === 429) {
			code = ErrorCode.RATE_LIMIT_EXCEEDED;
		}

		reply.code(error.statusCode).send({
			success: false,
			error: {
				code,
				message: error.message,
			},
		});
		return;
	}

	request.log.error(error);
	reply.code(500).send({
		success: false,
		error: {
			code: ErrorCode.INTERNAL_ERROR,
			message: "Internal server error",
		},
	});
}

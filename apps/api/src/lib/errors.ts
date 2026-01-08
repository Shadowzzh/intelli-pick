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

	// Add statusCode property for Fastify
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

export function handleError(
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Handle CORS and other early errors where reply might not be fully initialized
	if (typeof reply.code !== "function") {
		request.log.error(error);
		return;
	}

	if (error instanceof ApiError) {
		const statusCode = error.code === ErrorCode.NOT_FOUND ? 404 : 400;
		reply.code(statusCode).send({
			success: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
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

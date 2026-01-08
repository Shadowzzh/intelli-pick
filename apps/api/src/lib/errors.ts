// apps/api/src/lib/errors.ts
import { ErrorCode } from "@intellipick/shared";
import type { FastifyError, FastifyReply } from "fastify";

export class ApiError extends Error {
	constructor(
		public code: ErrorCode,
		message: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export class NotFoundError extends ApiError {
	constructor(resource: string, id: string) {
		super(
			ErrorCode.NOT_FOUND,
			`${resource} with id ${id} not found`,
		);
	}
}

export class ValidationError extends ApiError {
	constructor(message: string, details?: unknown) {
		super(
			ErrorCode.VALIDATION_ERROR,
			message,
			details,
		);
	}
}

export async function handleError(error: FastifyError, reply: FastifyReply) {
	if (error instanceof ApiError) {
		const statusCode = error.code === ErrorCode.NOT_FOUND ? 404 : 400;
		reply.status(statusCode).send({
			success: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
			},
		});
	} else {
		reply.log.error(error);
		reply.status(500).send({
			success: false,
			error: {
				code: ErrorCode.INTERNAL_ERROR,
				message: "Internal server error",
			},
		});
	}
}

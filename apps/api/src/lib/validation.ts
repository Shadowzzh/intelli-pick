// apps/api/src/lib/validation.ts
import type { PaginationParams } from "@intellipick/shared";

export function parsePagination(params: PaginationParams) {
	const page = Math.max(1, Number(params.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
	const offset = (page - 1) * limit;

	return { page, limit, offset };
}

export function validateId(id: string): void {
	if (!id || typeof id !== "string" || id.trim().length === 0) {
		throw new Error("Invalid ID format");
	}
}

// packages/shared/src/types/pagination.ts

/** 分页参数 */
export interface PaginationParams {
	page?: number;
	limit?: number;
}

/** 解析后的分页参数 */
export interface ParsedPagination {
	page: number;
	limit: number;
	offset: number;
}

/** 排序参数 */
export interface SortParams {
	field: string;
	direction: "asc" | "desc";
}

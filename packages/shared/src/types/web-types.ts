// packages/shared/src/types/web-types.ts

/** 统计数据 */
export interface Stats {
	totalContents: number;
	totalEntities: number;
	todayNew: number;
	activeSources: number;
}

/** 内容列表响应 (Web 前端使用) */
export interface ContentListResponse<T = unknown> {
	items: T[];
	total: number;
	nextPage?: number;
}

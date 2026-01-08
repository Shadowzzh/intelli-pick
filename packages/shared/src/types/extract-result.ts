// packages/shared/src/types/extract-result.ts

import { type ContentCategory } from "../constants/content-categories.js";

/**
 * AI 提取+分类输出结构
 */
export interface ExtractResult {
	title: string;
	summary: string;
	keyPoints: string[];
	dataPoints: string[];
	entities: ExtractedEntity[];
	category: ContentCategory;
	subCategory?: string; // 二级分类，AI 自由生成
	tags: string[];
}

export interface ExtractedEntity {
	name: string;
	type: EntityType;
	url?: string;
	description?: string;
}

// 完全开放的实体类型系统,允许 AI 自由定义
export type EntityType = string;

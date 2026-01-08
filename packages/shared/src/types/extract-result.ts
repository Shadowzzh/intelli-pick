// packages/shared/src/types/extract-result.ts

/**
 * 一级分类枚举
 */
export enum PrimaryCategory {
	Technology = "technology",
	Business = "business",
	Product = "product",
	Career = "career",
	News = "news",
	Lifestyle = "lifestyle",
	Other = "other",
}

/**
 * AI 提取+分类输出结构
 */
export interface ExtractResult {
	title: string;
	summary: string;
	keyPoints: string[];
	dataPoints: string[];
	entities: ExtractedEntity[];
	category: PrimaryCategory;
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

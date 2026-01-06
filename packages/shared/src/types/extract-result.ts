// packages/shared/src/types/extract-result.ts

/**
 * AI 提取+分类输出结构
 */
export interface ExtractResult {
  title: string;
  summary: string;
  keyPoints: string[];
  dataPoints: string[];
  entities: ExtractedEntity[];
  category: string;
  tags: string[];
}

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  url?: string;
  description?: string;
}

export type EntityType =
  | "tool"
  | "project"
  | "library"
  | "article"
  | "person"
  | "company"
  | "event";

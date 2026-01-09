// apps/api/src/graphql/resolvers.ts
/**
 * GraphQL Resolvers
 *
 * 定义 GraphQL 查询和类型解析器
 */
import type { IFieldResolver, IResolvers, MercuriusContext } from "mercurius";
import type {
	ContentsService,
	EntitiesService,
	SourcesService,
} from "../services/index";

/**
 * Content 类型的父对象类型
 * 用于字段解析器中的 parent 参数
 */
interface ContentParent {
	sourceId: string;
	id: string;
	filterResult?: {
		valueScore?: number;
	};
}

/**
 * 扩展 Mercurius 上下文类型
 * 添加自定义服务到全局 MercuriusContext
 */
declare module "mercurius" {
	interface MercuriusContext {
		contentsService: ContentsService;
		entitiesService: EntitiesService;
		sourcesService: SourcesService;
	}
}

/**
 * 创建 GraphQL 解析器
 *
 * @param contentsService - 内容服务实例
 * @param entitiesService - 实体服务实例
 * @param sourcesService - 数据源服务实例（用于字段解析器）
 * @returns GraphQL 解析器对象
 */
export function createResolvers(
	contentsService: ContentsService,
	entitiesService: EntitiesService,
	sourcesService?: SourcesService,
): IResolvers {
	return {
		// ========== 查询解析器 ==========

		Query: {
			/**
			 * 获取内容列表
			 * 支持分页、筛选和排序
			 */
			contents: async (
				_: unknown,
				args: {
					limit: number;
					offset: number;
					sources?: string[];
					minScore?: number;
					sortBy?: string;
					searchQuery?: string;
				},
			) => {
				const page = Math.floor(args.offset / args.limit) + 1;
				const result = await contentsService.findPaginated({
					page,
					limit: args.limit,
				});
				return result.data;
			},

			/**
			 * 获取单个内容
			 */
			content: async (_: unknown, args: { id: string }) => {
				const result = await contentsService.findById(args.id);
				return result?.data;
			},

			/**
			 * 获取热门实体列表
			 */
			entities: async (_: unknown, args: { limit: number; offset: number }) => {
				const page = Math.floor(args.offset / args.limit) + 1;
				const result = await entitiesService.findTrending({
					page,
					limit: args.limit,
				});
				return result.data;
			},

			/**
			 * 获取单个实体
			 */
			entity: async (_: unknown, args: { id: string }) => {
				const result = await entitiesService.findById(args.id);
				return result?.data;
			},
		},

		// ========== 类型解析器 ==========

		Content: {
			/**
			 * 解析内容的关联数据源
			 */
			source: async (
				parent: ContentParent,
				__: unknown,
				context: MercuriusContext,
			) => {
				if (!context?.sourcesService) {
					return null;
				}
				return await context.sourcesService.findById(parent.sourceId);
			},

			/**
			 * 解析内容关联的实体列表
			 */
			entities: async (
				parent: ContentParent,
				__: unknown,
				context: MercuriusContext,
			) => {
				return await context.entitiesService.findByContentId(parent.id);
			},

			/**
			 * 解析内容的 AI 评分
			 * 从 filterResult 中提取 valueScore
			 */
			aiScore: (parent: ContentParent) => {
				return parent.filterResult?.valueScore || null;
			},
		},
	};
}

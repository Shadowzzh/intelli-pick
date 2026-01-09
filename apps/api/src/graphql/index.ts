// apps/api/src/graphql/index.ts
/**
 * GraphQL Server Configuration
 *
 * 配置 GraphQL 类型和解析器
 */
import type {
	ContentsService,
	EntitiesService,
	SourcesService,
} from "../services/index.js";
import { createResolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

/**
 * 创建 GraphQL 服务器配置
 *
 * @param contentsService - 内容服务实例
 * @param entitiesService - 实体服务实例
 * @param sourcesService - 数据源服务实例
 * @returns GraphQL 类型定义和解析器配置
 */
export function createGraphQLServer(
	contentsService: ContentsService,
	entitiesService: EntitiesService,
	sourcesService: SourcesService,
) {
	const resolvers = createResolvers(
		contentsService,
		entitiesService,
		sourcesService,
	);

	return {
		typeDefs,
		resolvers,
		context: () => ({
			contentsService,
			entitiesService,
			sourcesService,
		}),
	};
}

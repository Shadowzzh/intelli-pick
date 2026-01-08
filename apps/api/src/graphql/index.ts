// apps/api/src/graphql/index.ts
import type {
	ContentsService,
	EntitiesService,
	SourcesService,
} from "../services/index.js";
import { createResolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

export function createGraphQLServer(
	contentsService: ContentsService,
	entitiesService: EntitiesService,
	sourcesService: SourcesService,
) {
	const resolvers = createResolvers(contentsService, entitiesService);

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

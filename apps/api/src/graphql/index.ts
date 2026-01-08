// apps/api/src/graphql/index.ts
import { createSchema, createYoga } from "graphql-yoga";
import type { ContentsService, EntitiesService } from "../services/index.js";
import { createResolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

export function createGraphQLServer(
	contentsService: ContentsService,
	entitiesService: EntitiesService,
) {
	const resolvers = createResolvers(contentsService, entitiesService);

	const yoga = createYoga({
		schema: createSchema({
			typeDefs,
			resolvers,
		}),
		graphqlEndpoint: "/graphql",
		context: () => ({
			contentsService,
			entitiesService,
		}),
	});

	return yoga;
}

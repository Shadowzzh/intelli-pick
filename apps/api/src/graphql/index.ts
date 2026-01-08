// apps/api/src/graphql/index.ts
import { createYoga, createSchema } from "graphql-yoga";
import type { ContentsService, EntitiesService } from "../services/index.js";
import { typeDefs } from "./schema.js";
import { createResolvers } from "./resolvers.js";

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
		// Enable GraphQL Playground in development
		playground: process.env.GRAPHQL_PLAYGROUND === "true",
		introspection: process.env.GRAPHQL_INTROSPECTION === "true",
	});

	return yoga;
}

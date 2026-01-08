// apps/api/src/graphql/resolvers.ts
import { ContentsService, EntitiesService } from "../services/index.js";

export function createResolvers(
	contentsService: ContentsService,
	entitiesService: EntitiesService,
) {
	return {
		Query: {
			contents: async (_: any, args: { limit: number; offset: number }) => {
				const page = Math.floor(args.offset / args.limit) + 1;
				const result = await contentsService.findPaginated({
					page,
					limit: args.limit,
				});
				return result.data;
			},

			content: async (_: any, args: { id: string }) => {
				const result = await contentsService.findById(args.id);
				return result?.data;
			},

			entities: async (_: any, args: { limit: number; offset: number }) => {
				const page = Math.floor(args.offset / args.limit) + 1;
				const result = await entitiesService.findTrending({
					page,
					limit: args.limit,
				});
				return result.data;
			},

			entity: async (_: any, args: { id: string }) => {
				const result = await entitiesService.findById(args.id);
				return result?.data;
			},
		},
	};
}

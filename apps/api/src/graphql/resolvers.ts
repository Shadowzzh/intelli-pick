// apps/api/src/graphql/resolvers.ts
import type { ContentsService, EntitiesService } from "../services/index.js";

export function createResolvers(
	contentsService: ContentsService,
	entitiesService: EntitiesService,
) {
	return {
		Query: {
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

			content: async (_: unknown, args: { id: string }) => {
				const result = await contentsService.findById(args.id);
				return result?.data;
			},

			entities: async (_: unknown, args: { limit: number; offset: number }) => {
				const page = Math.floor(args.offset / args.limit) + 1;
				const result = await entitiesService.findTrending({
					page,
					limit: args.limit,
				});
				return result.data;
			},

			entity: async (_: unknown, args: { id: string }) => {
				const result = await entitiesService.findById(args.id);
				return result?.data;
			},
		},

		Content: {
			source: async (parent: any, _: unknown, { sourcesService }: any) => {
				return await sourcesService.findById(parent.sourceId);
			},

			entities: async (parent: any, _: unknown, { entitiesService }: any) => {
				return await entitiesService.findByContentId(parent.id);
			},

			aiScore: (parent: any) => {
				return parent.filterResult?.valueScore || null;
			},
		},
	};
}

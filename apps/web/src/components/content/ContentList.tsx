import { api, queryKeys } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ContentFilters } from "./ContentFilters";
import { ContentItem } from "./ContentItem";

interface Source {
	name: string;
	type: string;
}

interface Entity {
	id: string;
	name: string;
	type: string;
}

interface Content {
	id: string;
	title: string;
	summary: string;
	url: string;
	source: Source;
	entities: Entity[];
	aiScore: number;
	publishedAt: string;
}

export function ContentList() {
	const { filters, viewMode, searchQuery } = useUIStore();

	const { data, isLoading, error } = useQuery<Content[]>({
		queryKey: [...queryKeys.contents, filters, viewMode.sortBy, searchQuery],
		queryFn: async () => {
			const result = await api.graphql<{
				contents: Content[];
			}>(
				`
        query GetContents(
          $sources: [String!]
          $minScore: Float
          $sortBy: String
          $searchQuery: String
        ) {
          contents(
            sources: $sources
            minScore: $minScore
            sortBy: $sortBy
            searchQuery: $searchQuery
          ) {
            id
            title
            summary
            url
            source { name type }
            entities { id name type }
            aiScore
            publishedAt
          }
        }
      `,
				{
					sources: filters.sources.length > 0 ? filters.sources : undefined,
					minScore: filters.minScore,
					sortBy: viewMode.sortBy,
					searchQuery: searchQuery || undefined,
				},
			);

			return result.contents;
		},
	});

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8 text-destructive">
				加载失败: {(error as Error).message}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<ContentFilters
				filters={filters}
				onFiltersChange={(newFilters) =>
					useUIStore.getState().setFilters(newFilters)
				}
			/>

			<div className="space-y-3">
				{data?.map((content) => (
					<ContentItem key={content.id} content={content} />
				))}
			</div>
		</div>
	);
}

import { sourcesApi } from "@/lib/api/sources";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Hook to get a map of sourceId -> source name
 * Returns a Map for O(1) lookup performance
 */
export function useSourcesMap() {
	const { data: sources } = useQuery({
		queryKey: sourcesApi.queryKeys.all(),
		queryFn: () => sourcesApi.getAll(),
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
	});

	const sourcesMap = useMemo(() => {
		if (!sources) return new Map<string, string>();
		return new Map(sources.map((source) => [source.id, source.name]));
	}, [sources]);

	return sourcesMap;
}

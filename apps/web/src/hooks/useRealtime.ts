import { queryKeys } from "@/lib/api";
import { socketManager } from "@/lib/socket";
import { useUIStore } from "@/store/ui-store";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { useEffect } from "react";

interface Content {
	id: string;
	title: string;
	summary: string;
	url: string;
	source: { name: string; type: string };
	entities: Array<{ id: string; name: string; type: string }>;
	aiScore: number;
	publishedAt: string;
}

interface PageData {
	items: Content[];
	[key: string]: unknown;
}

export function useRealtime() {
	const queryClient = useQueryClient();
	const { isRealtimeEnabled } = useUIStore();

	useEffect(() => {
		if (!isRealtimeEnabled) {
			socketManager.disconnect();
			return;
		}

		socketManager.connect();

		// Listen for new content
		socketManager.on("content:new", (...args: unknown[]) => {
			const [newContent] = args as [Content];
			queryClient.setQueryData(
				queryKeys.contents,
				(oldData: InfiniteData<PageData> | undefined) => {
					if (!oldData) return oldData;

					return {
						...oldData,
						pages: [
							{
								...oldData.pages[0],
								items: [newContent, ...oldData.pages[0].items],
							},
							...oldData.pages.slice(1),
						],
					};
				},
			);
		});

		// Listen for entity updates
		socketManager.on("entity:updated", () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.entities });
		});

		// Listen for stats updates
		socketManager.on("stats:updated", (newStats) => {
			queryClient.setQueryData(queryKeys.stats, newStats);
		});

		return () => {
			socketManager.disconnect();
		};
	}, [isRealtimeEnabled, queryClient]);
}

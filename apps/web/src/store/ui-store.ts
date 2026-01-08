import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FilterState {
	sources: string[];
	categories: string[];
	dateRange?: {
		from: Date;
		to: Date;
	};
	minScore?: number;
	entities?: string[];
}

interface ViewMode {
	mode: "all" | "content" | "entity" | "stats";
	sortBy: "date" | "score" | "relevance";
	layout: "list" | "grid";
}

interface UIState {
	filters: FilterState;
	viewMode: ViewMode;
	searchQuery: string;
	isRealtimeEnabled: boolean;

	setFilters: (filters: Partial<FilterState>) => void;
	resetFilters: () => void;
	setViewMode: (mode: ViewMode) => void;
	setSearchQuery: (query: string) => void;
	toggleRealtime: () => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			filters: {
				sources: [],
				categories: [],
			},
			viewMode: {
				mode: "all",
				sortBy: "date",
				layout: "list",
			},
			searchQuery: "",
			isRealtimeEnabled: true,

			setFilters: (newFilters) =>
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				})),

			resetFilters: () =>
				set({
					filters: { sources: [], categories: [] },
				}),

			setViewMode: (mode) => set({ viewMode: mode }),
			setSearchQuery: (query) => set({ searchQuery: query }),
			toggleRealtime: () =>
				set((state) => ({
					isRealtimeEnabled: !state.isRealtimeEnabled,
				})),
		}),
		{
			name: "intellipick-ui-storage",
		},
	),
);

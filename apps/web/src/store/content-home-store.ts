import type { DateRange } from "@/lib/date-utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ContentFilters {
	category?: string;
	sourceIds?: string[];
	tags?: string[];
}

type ViewMode = "compact" | "detailed";

interface ContentHomeState {
	// Date state
	selectedDate: Date;
	dateRange: DateRange;

	// Filters
	filters: ContentFilters;

	// View mode
	viewMode: ViewMode;

	// Page state
	currentPage: number;

	// Actions
	setSelectedDate: (date: Date) => void;
	setDateRange: (range: DateRange) => void;
	setFilters: (filters: Partial<ContentFilters>) => void;
	setViewMode: (mode: ViewMode) => void;
	setCurrentPage: (page: number) => void;
	resetFilters: () => void;
	removeCategory: () => void;
	removeTag: (tag: string) => void;
	removeSourceId: (sourceId: string) => void;
}

export const useContentHomeStore = create<ContentHomeState>()(
	persist(
		(set) => ({
			// Initial state - today's date
			selectedDate: new Date(),
			dateRange: { from: undefined, to: undefined },

			// No filters by default
			filters: {},

			// Default view mode
			viewMode: "compact",

			// Default page
			currentPage: 1,

			// Actions
			setSelectedDate: (date) => set({ selectedDate: date }),

			setDateRange: (range) => set({ dateRange: range }),

			setFilters: (newFilters) =>
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				})),

			setViewMode: (mode) => set({ viewMode: mode }),

			setCurrentPage: (page) => set({ currentPage: page }),

			resetFilters: () =>
				set({
					filters: {},
				}),

			removeCategory: () =>
				set((state) => ({
					filters: { ...state.filters, category: undefined },
				})),

			removeTag: (tagToRemove) =>
				set((state) => ({
					filters: {
						...state.filters,
						tags:
							state.filters.tags?.filter((tag) => tag !== tagToRemove) || [],
					},
				})),

			removeSourceId: (sourceIdToRemove) =>
				set((state) => ({
					filters: {
						...state.filters,
						sourceIds:
							state.filters.sourceIds?.filter(
								(id) => id !== sourceIdToRemove,
							) || [],
					},
				})),
		}),
		{
			name: "intellipick-content-home-storage",
			// Only persist filters and currentPage, not date objects or view mode
			// Date objects can't be properly serialized by localStorage
			partialize: (state) => ({
				filters: state.filters,
				currentPage: state.currentPage,
			}),
			// Handle migration - clear old data that might contain serialized dates
			version: 2,
			migrate: (persistedState) => {
				// Return only filters, discard any old date data
				const state = persistedState as Record<string, unknown> | undefined;
				return {
					filters: (state?.filters as ContentFilters | undefined) || {},
					currentPage: (state?.currentPage as number | undefined) || 1,
				};
			},
		},
	),
);

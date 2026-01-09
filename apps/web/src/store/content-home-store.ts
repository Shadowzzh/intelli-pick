import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DateRange {
	from: Date | undefined;
	to: Date | undefined;
}

interface ContentFilters {
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

	// Actions
	setSelectedDate: (date: Date) => void;
	setDateRange: (range: DateRange) => void;
	setFilters: (filters: Partial<ContentFilters>) => void;
	setViewMode: (mode: ViewMode) => void;
	resetFilters: () => void;
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

			// Actions
			setSelectedDate: (date) => set({ selectedDate: date }),

			setDateRange: (range) => set({ dateRange: range }),

			setFilters: (newFilters) =>
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				})),

			setViewMode: (mode) => set({ viewMode: mode }),

			resetFilters: () =>
				set({
					filters: {},
				}),
		}),
		{
			name: "intellipick-content-home-storage",
			// Only persist selected date and filters, not view mode
			partialize: (state) => ({
				selectedDate: state.selectedDate,
				dateRange: state.dateRange,
				filters: state.filters,
			}),
		},
	),
);

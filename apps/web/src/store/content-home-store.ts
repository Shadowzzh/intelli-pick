import type { DateRange } from "@/lib/date-utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ContentFilters {
	category?: string;
	sourceIds?: string[];
	tags?: string[];
	entityIds?: string[];
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

	// Search state
	searchQuery: string;

	// Actions
	setSelectedDate: (date: Date) => void;
	setDateRange: (range: DateRange) => void;
	setFilters: (filters: Partial<ContentFilters>) => void;
	setViewMode: (mode: ViewMode) => void;
	setCurrentPage: (page: number) => void;
	setSearchQuery: (query: string) => void;
	resetFilters: () => void;
	removeCategory: () => void;
	removeTag: (tag: string) => void;
	removeSourceId: (sourceId: string) => void;
	removeEntityId: (entityId: string) => void;
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

			// Default search query
			searchQuery: "",

			// Actions
			setSelectedDate: (date) => set({ selectedDate: date }),

			setDateRange: (range) => set({ dateRange: range, currentPage: 1 }),

			setFilters: (newFilters) =>
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
					currentPage: 1,
				})),

			setViewMode: (mode) => set({ viewMode: mode }),

			setCurrentPage: (page) => set({ currentPage: page }),

			setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

			resetFilters: () =>
				set({
					filters: {},
					currentPage: 1,
				}),

			removeCategory: () =>
				set((state) => ({
					filters: { ...state.filters, category: undefined },
					currentPage: 1,
				})),

			removeTag: (tagToRemove) =>
				set((state) => ({
					filters: {
						...state.filters,
						tags:
							state.filters.tags?.filter((tag) => tag !== tagToRemove) || [],
					},
					currentPage: 1,
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
					currentPage: 1,
				})),

			removeEntityId: (entityIdToRemove) =>
				set((state) => ({
					filters: {
						...state.filters,
						entityIds:
							state.filters.entityIds?.filter(
								(id) => id !== entityIdToRemove,
							) || [],
					},
					currentPage: 1,
				})),
		}),
		{
			name: "intellipick-content-home-storage",
			version: 3, // 升级版本号

			// 自定义 storage 处理 Date 序列化
			storage: {
				getItem: (name) => {
					if (!isLocalStorageAvailable()) {
						console.warn("localStorage is not available, using default state");
						return null;
					}

					try {
						const str = localStorage.getItem(name);
						if (!str) return null;

						const { state, version } = JSON.parse(str);

						// 验证数据结构
						if (!state || typeof state !== "object") {
							console.warn("Invalid state structure, resetting to default");
							return null;
						}

						// 版本迁移
						let migratedState = state;
						if (!version || version < 3) {
							migratedState = {
								filters: state?.filters || {},
								viewMode: state?.viewMode || "compact",
								dateRange: { from: undefined, to: undefined },
								currentPage: state?.currentPage || 1,
							};
						}

						// 恢复 Date 对象，带验证
						if (migratedState?.dateRange) {
							const from = migratedState.dateRange.from;
							const to = migratedState.dateRange.to;

							migratedState.dateRange = {
								from:
									from && !Number.isNaN(new Date(from).getTime())
										? new Date(from)
										: undefined,
								to:
									to && !Number.isNaN(new Date(to).getTime())
										? new Date(to)
										: undefined,
							};
						}

						return { state: migratedState, version: 3 };
					} catch (error) {
						console.error("Failed to parse persisted state:", error);
						// 清理损坏数据
						try {
							localStorage.removeItem(name);
						} catch {}
						return null;
					}
				},

				setItem: (name, value) => {
					if (!isLocalStorageAvailable()) {
						return; // 静默失败
					}

					try {
						const serialized = JSON.stringify(value);
						localStorage.setItem(name, serialized);
					} catch (error) {
						// 配额超限或其他错误
						if (
							error instanceof DOMException &&
							error.name === "QuotaExceededError"
						) {
							console.error("localStorage quota exceeded, clearing old data");
							try {
								localStorage.removeItem(name);
							} catch {}
						} else {
							console.error("Failed to persist state:", error);
						}
					}
				},

				removeItem: (name) => {
					if (!isLocalStorageAvailable()) {
						return;
					}

					try {
						localStorage.removeItem(name);
					} catch (error) {
						console.error("Failed to remove persisted state:", error);
					}
				},
			},

			// 选择性持久化
			partialize: (state) => ({
				filters: state.filters,
				viewMode: state.viewMode,
				dateRange: state.dateRange, // 现在可以持久化了
				currentPage: state.currentPage,
				// searchQuery 不持久化
				// selectedDate 不持久化
			}),
		},
	),
);

// 工具函数：检测 localStorage 可用性
function isLocalStorageAvailable(): boolean {
	try {
		const testKey = "__test__";
		localStorage.setItem(testKey, "test");
		localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
}

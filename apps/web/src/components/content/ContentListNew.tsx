import { FilterDisplay } from "@/components/content/FilterDisplay";
import { SearchBox } from "@/components/content/SearchBox";
import { ViewModeToggle } from "@/components/content/ViewModeToggle";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import {
	WidgetEmptyState,
	WidgetErrorState,
	WidgetLoadingState,
} from "@/components/widgets";
import { Widget } from "@/components/widgets/Widget";
import { contentsApi } from "@/lib/api/contents";
import { useContentHomeStore } from "@/store/content-home-store";
import type { Content } from "@intellipick/db";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronDown, ChevronUp, Newspaper } from "lucide-react";
import { useState } from "react";

type ContentViewMode = "compact" | "detailed";

interface ContentListProps {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}

export function ContentListNew({
	className,
	headerClassName,
	contentClassName,
}: ContentListProps) {
	const {
		dateRange,
		filters,
		viewMode,
		currentPage,
		searchQuery,
		removeCategory,
		removeTag,
		removeSourceId,
		removeEntityId,
		resetFilters,
		setCurrentPage,
		setSearchQuery,
	} = useContentHomeStore();

	// Build query params from store
	// 将 Date 对象转换为 UTC ISO 字符串，以匹配数据库的 timestamp with time zone
	const queryParams = {
		from: dateRange.from?.toISOString(),
		to: dateRange.to?.toISOString(),
		category: filters.category,
		tags: filters.tags,
		sourceIds: filters.sourceIds,
		entityIds: filters.entityIds,
		page: currentPage,
		limit: 50,
		search: searchQuery || undefined,
	};

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: contentsApi.queryKeys.filtered(queryParams),
		queryFn: () => contentsApi.getContents(queryParams),
	});

	const items = data?.data || [];
	const total = data?.meta?.total || "0";

	// 计算分页统计数据
	const limit = 50;
	const totalNum = Number.parseInt(total, 10);
	const totalPages = Math.ceil(totalNum / limit);
	const start = (currentPage - 1) * limit + 1;
	const end = Math.min(currentPage * limit, totalNum);

	// 处理页码变化
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	return (
		<Widget
			title="内容列表"
			icon={<Newspaper className="h-4 w-4" />}
			actions={
				<div className="flex items-center gap-2">
					<SearchBox value={searchQuery} onChange={setSearchQuery} />
					<ViewModeToggle />
				</div>
			}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
			footer={
				!isLoading && totalNum > 0 ? (
					<div className="flex items-center justify-between gap-4">
						<div className="text-sm text-muted-foreground">
							<span className="font-medium text-foreground">
								{start} - {end}
							</span>{" "}
							/ {total} 条
						</div>
						{totalPages > 1 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				) : null
			}
		>
			{/* Show filter summary */}
			<FilterDisplay
				className="mb-4"
				filters={filters}
				onRemoveCategory={removeCategory}
				onRemoveTag={removeTag}
				onRemoveSourceId={removeSourceId}
				onRemoveEntityId={removeEntityId}
				onClearAll={resetFilters}
			/>

			{/* Loading state */}
			{isLoading && <WidgetLoadingState lines={5} variant="card" />}

			{/* Error state */}
			{error && (
				<WidgetErrorState
					error={error as Error}
					onRetry={() => refetch()}
					message="加载失败"
				/>
			)}

			{/* Empty state */}
			{!isLoading && !error && items.length === 0 && (
				<WidgetEmptyState
					message={searchQuery ? "没有找到匹配的内容" : "没有找到内容"}
				/>
			)}

			{/* Content items */}
			{!isLoading && !error && items.length > 0 && (
				<div className="space-y-3">
					{items.map((item: Content) => (
						<ContentListItem
							key={`${item.id}:${viewMode}`}
							item={item}
							viewMode={viewMode}
						/>
					))}
				</div>
			)}
		</Widget>
	);
}

interface ContentListItemProps {
	item: Content;
	viewMode: ContentViewMode;
}

function ContentListItem({ item, viewMode }: ContentListItemProps) {
	const [itemViewMode, setItemViewMode] = useState<ContentViewMode>(viewMode);

	const isDetailed = itemViewMode === "detailed";
	const toggleLabel = isDetailed ? "切换为简略视图" : "切换为详细视图";

	const handleToggleView = () => {
		let nextViewMode: ContentViewMode = "detailed";
		if (isDetailed) {
			nextViewMode = "compact";
		}

		setItemViewMode(nextViewMode);
	};

	return (
		<div className="relative">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="absolute right-3 top-3 z-10 size-8 bg-transparent text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground"
				onClick={handleToggleView}
				aria-label={toggleLabel}
				title={toggleLabel}
			>
				{isDetailed ? (
					<ChevronUp className="h-4 w-4" />
				) : (
					<ChevronDown className="h-4 w-4" />
				)}
			</Button>
			{isDetailed ? (
				<ContentDetailedCard item={item} />
			) : (
				<ContentCompactCard item={item} />
			)}
		</div>
	);
}

function ContentCompactCard({ item }: { item: Content }) {
	const handleClick = () => {
		if (item.url) {
			window.open(item.url, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<button
			type="button"
			className="group w-full cursor-pointer rounded-lg border border-border/60 bg-card/50 p-4 pr-14 text-left transition-all duration-200 hover:border-primary/60 hover:bg-card hover:shadow-md"
			onClick={handleClick}
		>
			{/* Title */}
			<div className="flex items-start justify-between gap-2 mb-2">
				<div className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 flex-1 leading-snug">
					{item.title || "无标题"}
				</div>
			</div>

			{/* Summary */}
			{item.summary && (
				<p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
					{item.summary}
				</p>
			)}
		</button>
	);
}

function ContentDetailedCard({ item }: { item: Content }) {
	const handleClick = () => {
		if (item.url) {
			window.open(item.url, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<button
			type="button"
			className="group w-full cursor-pointer rounded-lg border border-border/60 bg-card/50 p-5 pr-14 text-left transition-all duration-200 hover:border-primary/60 hover:bg-card hover:shadow-md"
			onClick={handleClick}
		>
			{/* Title */}
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 flex-1 leading-snug">
					{item.title || "无标题"}
				</div>
			</div>

			{/* Summary */}
			{item.summary && (
				<p className="text-sm text-muted-foreground/80 mb-3 leading-relaxed">
					{item.summary}
				</p>
			)}

			{/* Key points - if available */}
			{item.keyPoints && item.keyPoints.length > 0 && (
				<ul className="list-disc list-inside text-sm text-muted-foreground/80 mb-3 space-y-1 marker:text-muted-foreground">
					{item.keyPoints.slice(0, 3).map((point, idx) => (
						<li key={idx} className="leading-relaxed">
							{point}
						</li>
					))}
				</ul>
			)}

			{/* Meta info */}
			<div className="flex items-center gap-3 text-sm text-muted-foreground/80 mb-3">
				{item.author && <span className="font-medium">by {item.author}</span>}
				{item.category && (
					<span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-md">
						{item.category}
					</span>
				)}
				{item.publishedAt && (
					<span className="text-xs">
						{formatDistanceToNow(new Date(item.publishedAt), {
							addSuffix: true,
							locale: zhCN,
						})}
					</span>
				)}
			</div>

			{/* Tags */}
			{item.tags && item.tags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{item.tags.map((tag) => (
						<span
							key={tag}
							className="px-2.5 py-1 text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors duration-150 cursor-default"
						>
							{tag}
						</span>
					))}
				</div>
			)}
		</button>
	);
}

import { FilterDisplay } from "@/components/content/FilterDisplay";
import { SearchBox } from "@/components/content/SearchBox";
import { ViewModeToggle } from "@/components/content/ViewModeToggle";
import { Pagination } from "@/components/ui/Pagination";
import { Widget } from "@/components/widgets/Widget";
import { contentsApi } from "@/lib/api/contents";
import { useContentHomeStore } from "@/store/content-home-store";
import type { Content } from "@intellipick/db";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2, Newspaper } from "lucide-react";

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
		page: currentPage,
		limit: 20,
		search: searchQuery || undefined,
	};

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: contentsApi.queryKeys.filtered(queryParams),
		queryFn: () => contentsApi.getContents(queryParams),
	});

	const items = data?.data || [];
	const total = data?.meta?.total || "0";

	// 计算分页统计数据
	const limit = 20;
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
				totalPages > 1 ? (
					<div className="flex items-center justify-between gap-4">
						<div className="text-sm text-muted-foreground">
							<span className="font-medium text-foreground">
								{start} - {end}
							</span>{" "}
							/ {total} 条
						</div>
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={handlePageChange}
						/>
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
				onClearAll={resetFilters}
			/>

			{isLoading && (
				<div className="flex flex-col items-center justify-center py-16">
					<Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
					<p className="text-sm text-muted-foreground">加载中...</p>
				</div>
			)}

			{error && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="w-16 h-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
						<Newspaper className="h-8 w-8 text-destructive/60" />
					</div>
					<p className="text-destructive font-medium mb-2">加载失败</p>
					<p className="text-sm text-muted-foreground/70 mb-4 max-w-md text-center">
						{(error as Error).message}
					</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
					>
						重试
					</button>
				</div>
			)}

			{!isLoading && !error && items.length === 0 && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="w-16 h-16 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
						<Newspaper className="h-8 w-8 text-muted-foreground/60" />
					</div>
					<p className="text-muted-foreground font-medium mb-2">
						{searchQuery ? "没有找到匹配的内容" : "没有找到内容"}
					</p>
					<p className="text-sm text-muted-foreground/70 text-center max-w-md">
						{searchQuery
							? "试试调整搜索关键词或清除搜索条件"
							: "试试调整筛选条件或选择其他日期范围"}
					</p>
				</div>
			)}

			{!isLoading && !error && items.length > 0 && (
				<div className="space-y-3">
					{/* Content items */}
					{items.map((item: Content, index: number) => (
						<ContentListItem
							key={item.id}
							item={item}
							viewMode={viewMode}
							index={index}
						/>
					))}
				</div>
			)}
		</Widget>
	);
}

interface ContentListItemProps {
	item: Content;
	viewMode: "compact" | "detailed";
	index: number;
}

function ContentListItem({ item, viewMode }: ContentListItemProps) {
	if (viewMode === "detailed") {
		return <ContentDetailedCard item={item} />;
	}

	return <ContentCompactCard item={item} />;
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
			className="group p-4 border border-border/60 bg-card/50 rounded-lg hover:border-primary/60 hover:shadow-md hover:bg-card transition-all duration-200 cursor-pointer text-left w-full"
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
			className="group p-5 border border-border/60 bg-card/50 rounded-lg hover:border-primary/60 hover:shadow-md hover:bg-card transition-all duration-200 cursor-pointer text-left w-full"
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

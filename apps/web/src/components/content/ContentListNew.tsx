import { FilterDisplay } from "@/components/content/FilterDisplay";
import { Widget } from "@/components/widgets/Widget";
import { contentsApi } from "@/lib/api/contents";
import { useContentHomeStore } from "@/store/content-home-store";
import type { Content } from "@intellipick/db";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ExternalLink, Loader2, Newspaper } from "lucide-react";

interface ContentListProps {
	className?: string;
}

export function ContentListNew({ className }: ContentListProps) {
	const {
		dateRange,
		filters,
		viewMode,
		removeCategory,
		removeTag,
		removeSourceId,
		resetFilters,
	} = useContentHomeStore();

	// Build query params from store
	// 将 Date 对象转换为 UTC ISO 字符串，以匹配数据库的 timestamp with time zone
	const queryParams = {
		from: dateRange.from?.toISOString(),
		to: dateRange.to?.toISOString(),
		category: filters.category,
		tags: filters.tags,
		sourceIds: filters.sourceIds,
		page: 1,
		limit: 20,
	};

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: contentsApi.queryKeys.filtered(queryParams),
		queryFn: () => contentsApi.getContents(queryParams),
	});

	const items = data?.data || [];
	const total = data?.meta?.total || "0";

	return (
		<Widget
			title="内容列表"
			icon={<Newspaper className="h-4 w-4" />}
			className={className}
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
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			)}

			{error && (
				<div className="text-center py-12">
					<p className="text-destructive mb-2">加载失败</p>
					<p className="text-sm text-muted-foreground mb-4">
						{(error as Error).message}
					</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="text-sm text-primary hover:underline"
					>
						重试
					</button>
				</div>
			)}

			{!isLoading && !error && items.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">没有找到内容</p>
					<p className="text-sm text-muted-foreground mt-2">
						试试调整筛选条件或选择其他日期
					</p>
				</div>
			)}

			{!isLoading && !error && items.length > 0 && (
				<div className="space-y-3">
					{/* Content items */}
					{items.map((item: Content) => (
						<ContentListItem key={item.id} item={item} viewMode={viewMode} />
					))}

					{/* Pagination placeholder */}
					{Number.parseInt(total, 10) > items.length && (
						<div className="pt-4 text-center">
							<p className="text-sm text-muted-foreground">
								显示 {items.length} / {total} 条
							</p>
						</div>
					)}
				</div>
			)}
		</Widget>
	);
}

interface ContentListItemProps {
	item: Content;
	viewMode: "compact" | "detailed";
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
		<div
			className="group p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" && item.url) {
					window.open(item.url, "_blank", "noopener,noreferrer");
				}
			}}
		>
			{/* Title */}
			<div className="flex items-start justify-between gap-2 mb-2">
				<div className="font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1">
					{item.title || "无标题"}
				</div>
			</div>

			{/* Summary */}
			{item.summary && (
				<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
					{item.summary}
				</p>
			)}

			{/* Meta info */}
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				{item.category && <span>{item.category}</span>}
				{item.publishedAt && (
					<>
						{item.category && <span>·</span>}
						<span>
							{formatDistanceToNow(new Date(item.publishedAt), {
								addSuffix: true,
								locale: zhCN,
							})}
						</span>
					</>
				)}
			</div>

			{/* Tags */}
			{item.tags && item.tags.length > 0 && (
				<div className="flex flex-wrap gap-1 mt-2">
					{item.tags.slice(0, 3).map((tag) => (
						<span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded-md">
							{tag}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

function ContentDetailedCard({ item }: { item: Content }) {
	const handleClick = () => {
		if (item.url) {
			window.open(item.url, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<div
			className="group p-5 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" && item.url) {
					window.open(item.url, "_blank", "noopener,noreferrer");
				}
			}}
		>
			{/* Title */}
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors flex-1">
					{item.title || "无标题"}
				</div>
				<ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
			</div>

			{/* Summary */}
			{item.summary && (
				<p className="text-sm text-muted-foreground mb-3">{item.summary}</p>
			)}

			{/* Key points - if available */}
			{item.keyPoints && item.keyPoints.length > 0 && (
				<ul className="list-disc list-inside text-sm text-muted-foreground mb-3 space-y-1">
					{item.keyPoints.slice(0, 3).map((point, idx) => (
						<li key={idx}>{point}</li>
					))}
				</ul>
			)}

			{/* Meta info */}
			<div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
				{item.author && <span>by {item.author}</span>}
				{item.category && <span>· {item.category}</span>}
				{item.publishedAt && (
					<span>
						·{" "}
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
						<span key={tag} className="px-2 py-1 text-xs bg-muted rounded-md">
							{tag}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

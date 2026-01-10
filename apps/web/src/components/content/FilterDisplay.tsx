import type { ContentFilters } from "@/store/content-home-store";
import { X } from "lucide-react";
import { memo } from "react";

interface FilterDisplayProps {
	filters: ContentFilters;
	onRemoveCategory?: () => void;
	onRemoveTag?: (tag: string) => void;
	onRemoveSourceId?: (sourceId: string) => void;
	onClearAll?: () => void;
	className?: string;
}

export const FilterDisplay = memo(function FilterDisplay({
	filters,
	onRemoveCategory,
	onRemoveTag,
	onRemoveSourceId,
	onClearAll,
	className = "",
}: FilterDisplayProps) {
	// 如果没有任何筛选条件，不显示组件
	const hasFilters =
		filters.category ||
		(filters.tags && filters.tags.length > 0) ||
		(filters.sourceIds && filters.sourceIds.length > 0);

	if (!hasFilters) {
		return null;
	}

	// 构建筛选条件片段数组
	const filterParts: React.ReactNode[] = [];

	// 分类
	if (filters.category) {
		filterParts.push(
			<button
				key="category"
				type="button"
				onClick={onRemoveCategory}
				className="inline-flex items-center gap-1 px-1 py-0.5 hover:text-destructive text-sm cursor-pointer transition-colors"
				title="清除分类筛选"
			>
				<span>{filters.category}</span>
				<X className="h-3 w-3 shrink-0 opacity-60" />
			</button>,
		);
	}

	// 标签
	if (filters.tags && filters.tags.length > 0) {
		for (const tag of filters.tags) {
			filterParts.push(
				<button
					key={tag}
					type="button"
					onClick={() => onRemoveTag?.(tag)}
					className="inline-flex items-center gap-1 px-1 py-0.5 hover:text-destructive text-sm cursor-pointer transition-colors"
					title={`清除标签：${tag}`}
				>
					<span>{tag}</span>
					<X className="h-3 w-3 shrink-0 opacity-60" />
				</button>,
			);
		}
	}

	// 数据源
	if (filters.sourceIds && filters.sourceIds.length > 0) {
		for (const sourceId of filters.sourceIds) {
			filterParts.push(
				<button
					key={sourceId}
					type="button"
					onClick={() => onRemoveSourceId?.(sourceId)}
					className="inline-flex items-center gap-1 px-1 py-0.5 hover:text-destructive text-sm cursor-pointer transition-colors"
					title={`清除数据源：${sourceId}`}
				>
					<span>{sourceId.slice(0, 8)}</span>
					<X className="h-3 w-3 shrink-0 opacity-60" />
				</button>,
			);
		}
	}

	return (
		<div className={`flex gap-4 text-sm pb-3 border-b ${className}`}>
			<div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
				<span className="text-muted-foreground shrink-0">筛选：</span>
				{filterParts.map((part, index) => (
					<span key={index} className="inline-flex items-center">
						{part}
					</span>
				))}
			</div>
			{onClearAll && (
				<div className="shrink-0">
					<button
						type="button"
						onClick={onClearAll}
						className="text-xs text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
					>
						[全部清除]
					</button>
				</div>
			)}
		</div>
	);
});

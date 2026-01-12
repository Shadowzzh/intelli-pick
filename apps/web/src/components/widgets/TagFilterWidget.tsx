import { Badge } from "@/components/ui/badge";
import { WidgetLoadingState, WidgetWithStates } from "@/components/widgets";
import { contentsApi } from "@/lib/api/contents";
import { useContentHomeStore } from "@/store/content-home-store";
import { useQuery } from "@tanstack/react-query";
import { Tag as TagIcon } from "lucide-react";
import { X } from "lucide-react";
import { useEffect } from "react";

export function TagFilterWidget({
	className,
	headerClassName,
	contentClassName,
}: {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}) {
	const { filters, setFilters, dateRange } = useContentHomeStore();

	const query = useQuery({
		queryKey: contentsApi.queryKeys.tags({
			from: dateRange.from?.toISOString(),
			to: dateRange.to?.toISOString(),
		}),
		queryFn: () =>
			contentsApi.getPopularTags({
				limit: 50,
				from: dateRange.from?.toISOString(),
				to: dateRange.to?.toISOString(),
			}),
	});

	// 如果当前选中的标签不在查询结果中，自动清除不存在的标签
	useEffect(() => {
		if (query.data?.tags && filters.tags && filters.tags.length > 0) {
			const availableTagNames = new Set(query.data.tags.map((tag) => tag.name));
			const validTags = filters.tags.filter((tag) =>
				availableTagNames.has(tag),
			);

			// 如果有标签被过滤掉了，更新筛选条件
			if (validTags.length !== filters.tags.length) {
				setFilters({
					tags: validTags.length > 0 ? validTags : undefined,
				});
			}
		}
	}, [query.data, filters.tags, setFilters]);

	const selectedTags = filters.tags || [];

	const handleTagClick = (tagName: string) => {
		const updated = selectedTags.includes(tagName)
			? selectedTags.filter((t) => t !== tagName)
			: [...selectedTags, tagName];

		setFilters({ tags: updated.length > 0 ? updated : undefined });
	};

	const handleClearAll = () => {
		setFilters({ tags: undefined });
	};

	return (
		<WidgetWithStates
			query={query}
			title="标签"
			icon={<TagIcon className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
			loading={<WidgetLoadingState variant="tag" />}
			empty={{ message: "暂无标签", iconType: "tags" }}
			actions={
				selectedTags.length > 0 ? (
					<button
						type="button"
						onClick={handleClearAll}
						className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
					>
						<X className="h-3 w-3" />
						清除
					</button>
				) : null
			}
		>
			{({ tags }) => (
				<>
					{/* Selected tags */}
					{selectedTags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-3 pb-3 border-b">
							{selectedTags.map((tag) => (
								<Badge
									key={tag}
									variant="default"
									className="cursor-pointer"
									onClick={() => handleTagClick(tag)}
								>
									{tag}
									<X className="h-3 w-3 ml-1" />
								</Badge>
							))}
						</div>
					)}

					{/* Popular tags */}
					<div className="flex flex-wrap gap-1">
						{tags?.map((tag) => {
							const isSelected = selectedTags.includes(tag.name);

							return (
								<Badge
									key={tag.name}
									variant={isSelected ? "default" : "secondary"}
									className={`
                py-3 leading-0 flex items-center justify-center
                cursor-pointer transition-colors
                ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
              `}
									onClick={() => handleTagClick(tag.name)}
									title={`${tag.count} 个内容`}
								>
									{tag.name}
								</Badge>
							);
						})}
					</div>
				</>
			)}
		</WidgetWithStates>
	);
}

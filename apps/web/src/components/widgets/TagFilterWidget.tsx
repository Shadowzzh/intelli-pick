import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/widgets/Widget";
import { contentsApi } from "@/lib/api/contents";
import { useContentHomeStore } from "@/store/content-home-store";
import { useQuery } from "@tanstack/react-query";
import { Tag as TagIcon } from "lucide-react";
import { X } from "lucide-react";

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

	// Fetch popular tags from API
	const { data: tagsData, isLoading } = useQuery({
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

	const tags = tagsData?.tags || [];

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

	if (isLoading) {
		return (
			<Widget
				title="标签"
				icon={<TagIcon className="h-4 w-4" />}
				className={className}
				headerClassName={headerClassName}
				contentClassName={contentClassName}
			>
				<div className="space-y-2">
					{[...Array(6)].map((_, i) => (
						<Skeleton key={`skeleton-${i}`} className="h-6 w-full" />
					))}
				</div>
			</Widget>
		);
	}

	return (
		<Widget
			title="标签"
			icon={<TagIcon className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
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
		</Widget>
	);
}

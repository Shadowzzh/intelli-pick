import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/widgets/Widget";
import { contentsApi } from "@/lib/api/contents";
import { cn } from "@/lib/utils";
import { useContentHomeStore } from "@/store/content-home-store";
import { useQuery } from "@tanstack/react-query";
import { Folder } from "lucide-react";

export function CategoryNavWidget({
	className,
	headerClassName,
	contentClassName,
}: {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}) {
	const { filters, setFilters } = useContentHomeStore();

	// Fetch category statistics from API
	const { data: categoryStats, isLoading } = useQuery({
		queryKey: contentsApi.queryKeys.categories(),
		queryFn: () => contentsApi.getCategoryStats(),
	});

	const categories = categoryStats?.categories || [];

	const handleCategoryClick = (category: string) => {
		// Toggle category filter
		if (filters.category === category) {
			setFilters({ category: undefined });
		} else {
			setFilters({ category });
		}
	};

	if (isLoading) {
		return (
			<Widget
				title="分类"
				icon={<Folder className="h-4 w-4" />}
				className={cn(className)}
				headerClassName={headerClassName}
				contentClassName={contentClassName}
			>
				<div className="space-y-2">
					{[...Array(5)].map((_, i) => (
						<Skeleton key={`skeleton-${i}`} className="h-8 w-full" />
					))}
				</div>
			</Widget>
		);
	}

	return (
		<Widget
			title="分类"
			icon={<Folder className="h-4 w-4" />}
			contentClassName={cn("p-0", contentClassName)}
			className={cn(className)}
			headerClassName={headerClassName}
		>
			<div>
				{categories?.map((category) => (
					<button
						key={category.name}
						type="button"
						onClick={() => handleCategoryClick(category.name)}
						className={`
              w-full flex items-center justify-between px-4 py-1.5
              hover:border-l-primary border-l border-l-transparent transition-colors cursor-pointer
              ${filters.category === category.name ? "bg-secondary" : ""}
            `}
					>
						<span className="text-sm">{category.name}</span>
						<Badge variant="secondary" className="text-xs">
							{category.count}
						</Badge>
					</button>
				))}
			</div>
		</Widget>
	);
}

import { Badge } from "@/components/ui/badge";
import { WidgetLoadingState, WidgetWithStates } from "@/components/widgets";
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

	const query = useQuery({
		queryKey: contentsApi.queryKeys.categories(),
		queryFn: () => contentsApi.getCategoryStats(),
	});

	const handleCategoryClick = (category: string) => {
		// Toggle category filter
		if (filters.category === category) {
			setFilters({ category: undefined });
		} else {
			setFilters({ category });
		}
	};

	return (
		<WidgetWithStates
			query={query}
			title="分类"
			icon={<Folder className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={cn("p-0", contentClassName)}
			loading={<WidgetLoadingState lines={5} />}
			empty={{ message: "暂无分类" }}
		>
			{({ categories }) => (
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
			)}
		</WidgetWithStates>
	);
}

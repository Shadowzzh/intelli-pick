import { Badge } from "@/components/ui/badge";
import {
	WidgetLoadingState,
	WidgetWithStates,
} from "@/components/widgets";
import { useQuery } from "@tanstack/react-query";
import { Hash } from "lucide-react";

interface Tag {
	name: string;
	count: number;
}

export function PopularTagsWidget({
	className,
	headerClassName,
	contentClassName,
}: {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}) {
	const query = useQuery<Tag[]>({
		queryKey: ["tags", "popular"],
		queryFn: async () => {
			// TODO: Replace with real API call
			// return await api.get("/api/v1/tags/popular");
			return [
				{ name: "react", count: 342 },
				{ name: "ai", count: 285 },
				{ name: "typescript", count: 231 },
				{ name: "nextjs", count: 187 },
				{ name: "rust", count: 156 },
				{ name: "python", count: 142 },
				{ name: "machine-learning", count: 128 },
				{ name: "web3", count: 95 },
				{ name: "database", count: 87 },
				{ name: "performance", count: 72 },
				{ name: "security", count: 68 },
				{ name: "testing", count: 54 },
				{ name: "devops", count: 48 },
				{ name: "frontend", count: 45 },
				{ name: "backend", count: 42 },
			];
		},
	});

	return (
		<WidgetWithStates
			query={query}
			title="热门标签"
			icon={<Hash className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
			loading={<WidgetLoadingState variant="tag" />}
			empty={{ message: "暂无热门标签", iconType: "tags" }}
		>
			{(tagList) => {
				// Calculate size based on count (min 1, max 3)
				const maxCount = Math.max(...tagList.map((t) => t.count));

				const getSize = (count: number) => {
					const ratio = count / maxCount;
					if (ratio > 0.7) return "lg";
					if (ratio > 0.4) return "md";
					return "sm";
				};

				return (
					<>
						<div className="flex flex-wrap gap-2">
							{tagList.map((tag) => {
								const size = getSize(tag.count);

								return (
									<Badge
										key={tag.name}
										variant="outline"
										className={`
                  cursor-pointer hover:bg-accent transition-colors
                  ${size === "lg" ? "px-3 py-1.5 text-sm" : ""}
                  ${size === "md" ? "px-2.5 py-1 text-xs" : ""}
                  ${size === "sm" ? "px-2 py-0.5 text-xs" : ""}
                `}
										title={`${tag.count} 个内容`}
									>
										{tag.name}
									</Badge>
								);
							})}
						</div>

						{/* Footer with total count */}
						<div className="mt-3 pt-3 border-t text-xs text-center text-muted-foreground">
							共 {tagList.length} 个标签
						</div>
					</>
				);
			}}
		</WidgetWithStates>
	);
}

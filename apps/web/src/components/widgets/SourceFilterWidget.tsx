import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WidgetLoadingState, WidgetWithStates } from "@/components/widgets";
import { contentsApi } from "@/lib/api/contents";
import { useContentHomeStore } from "@/store/content-home-store";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Rss } from "lucide-react";
import { useEffect } from "react";

const sourceTypeIcons: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	rss: Rss,
	twitter: MessageCircle,
	v2ex: MessageCircle,
};

export function SourceFilterWidget({
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
		queryKey: contentsApi.queryKeys.sources({
			from: dateRange.from?.toISOString(),
			to: dateRange.to?.toISOString(),
		}),
		queryFn: () =>
			contentsApi.getSourceStats({
				from: dateRange.from?.toISOString(),
				to: dateRange.to?.toISOString(),
			}),
	});

	// 如果当前选中的 sourceIds 不在查询结果中，自动清除不存在的 sourceIds
	useEffect(() => {
		if (
			query.data?.sources &&
			filters.sourceIds &&
			filters.sourceIds.length > 0
		) {
			const availableSourceIds = new Set(query.data.sources.map((s) => s.id));
			const validSourceIds = filters.sourceIds.filter((id) =>
				availableSourceIds.has(id),
			);

			// 如果有 sourceId 被过滤掉了，更新筛选条件
			if (validSourceIds.length !== filters.sourceIds.length) {
				setFilters({
					sourceIds: validSourceIds.length > 0 ? validSourceIds : undefined,
				});
			}
		}
	}, [query.data, filters.sourceIds, setFilters]);

	const handleSourceToggle = (sourceId: string) => {
		const current = filters.sourceIds || [];
		const updated = current.includes(sourceId)
			? current.filter((id) => id !== sourceId)
			: [...current, sourceId];

		setFilters({ sourceIds: updated.length > 0 ? updated : undefined });
	};

	return (
		<WidgetWithStates
			query={query}
			title="数据源"
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
			loading={<WidgetLoadingState lines={4} />}
			empty={{ message: "暂无数据源" }}
		>
			{({ sources }) => (
				<div className="space-y-2">
					{sources?.map((source) => {
						const Icon = sourceTypeIcons[source.type];
						const isChecked = !!filters.sourceIds?.includes(source.id);

						return (
							<div
								key={source.id}
								className="flex items-center space-x-2 px-2 py-1 cursor-pointer "
								onKeyDown={() => handleSourceToggle(source.id)}
								onClick={(e) => {
									e.preventDefault();
									handleSourceToggle(source.id);
								}}
							>
								<Checkbox id={`source-${source.id}`} checked={isChecked} />
								<Label
									htmlFor={`source-${source.id}`}
									className="flex items-center gap-2 text-sm cursor-pointer flex-1"
								>
									<Icon className="h-3 w-3 text-muted-foreground" />
									<span className="truncate">{source.name}</span>
								</Label>
								<Badge variant="secondary" className="text-xs">
									{source.count}
								</Badge>
							</div>
						);
					})}
				</div>
			)}
		</WidgetWithStates>
	);
}

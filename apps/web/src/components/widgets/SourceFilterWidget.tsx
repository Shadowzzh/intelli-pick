import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WidgetLoadingState, WidgetWithStates } from "@/components/widgets";
import { sourcesApi } from "@/lib/api/sources";
import { useContentHomeStore } from "@/store/content-home-store";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Rss } from "lucide-react";

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
	const { filters, setFilters } = useContentHomeStore();

	const query = useQuery({
		queryKey: sourcesApi.queryKeys.all(),
		queryFn: () => sourcesApi.getAll(),
	});

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
			{(sources) => (
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
							</div>
						);
					})}
				</div>
			)}
		</WidgetWithStates>
	);
}

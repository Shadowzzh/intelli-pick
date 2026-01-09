import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Rss } from "lucide-react";

interface Source {
	id: string;
	name: string;
	type: "rss" | "twitter" | "v2ex";
	enabled: boolean;
}

const sourceTypeIcons = {
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

	// Mock data for now
	const { data: sources, isLoading } = useQuery<Source[]>({
		queryKey: ["sources"],
		queryFn: async () => {
			// TODO: Replace with real API call
			return [
				{ id: "1", name: "TechCrunch", type: "rss", enabled: true },
				{ id: "2", name: "Hacker News", type: "rss", enabled: true },
				{ id: "3", name: "V2EX", type: "v2ex", enabled: true },
				{ id: "4", name: "Tech Twitter", type: "twitter", enabled: true },
			];
		},
	});

	const handleSourceToggle = (sourceId: string) => {
		const current = filters.sourceIds || [];
		const updated = current.includes(sourceId)
			? current.filter((id) => id !== sourceId)
			: [...current, sourceId];

		setFilters({ sourceIds: updated.length > 0 ? updated : undefined });
	};

	if (isLoading) {
		return (
			<Widget
				title="数据源"
				className={className}
				headerClassName={headerClassName}
				contentClassName={contentClassName}
			>
				<div className="space-y-3">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={`skeleton-${i}`} className="h-8 w-full" />
					))}
				</div>
			</Widget>
		);
	}

	return (
		<Widget
			title="数据源"
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
		>
			<div className="space-y-2">
				{sources?.map((source) => {
					const Icon = sourceTypeIcons[source.type];
					const isChecked = filters.sourceIds?.includes(source.id);

					return (
						<div
							key={source.id}
							className="flex items-center space-x-2 px-2 py-1"
						>
							<Checkbox
								id={`source-${source.id}`}
								checked={isChecked}
								onCheckedChange={() => handleSourceToggle(source.id)}
							/>
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
		</Widget>
	);
}

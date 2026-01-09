import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/widgets/Widget";
import { type Entity, entitiesApi } from "@/lib/api/entities";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";

export function TrendingEntitiesWidget({
	className,
	headerClassName,
	contentClassName,
}: {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}) {
	const { data, isLoading } = useQuery({
		queryKey: entitiesApi.queryKeys.trending({ limit: 10 }),
		queryFn: () => entitiesApi.getTrending({ limit: 10 }),
	});

	if (isLoading) {
		return (
			<Widget
				title="趋势实体"
				icon={<TrendingUp className="h-4 w-4" />}
				className={className}
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

	const entities = data?.data || [];

	if (entities.length === 0) {
		return (
			<Widget
				title="趋势实体"
				icon={<TrendingUp className="h-4 w-4" />}
				className={className}
				headerClassName={headerClassName}
				contentClassName={contentClassName}
			>
				<p className="text-sm text-muted-foreground">暂无数据</p>
			</Widget>
		);
	}

	return (
		<Widget
			title="趋势实体"
			icon={<TrendingUp className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
		>
			<div className="space-y-2">
				{entities.map((entity, index) => (
					<EntityListItem key={entity.id} entity={entity} rank={index + 1} />
				))}
			</div>
		</Widget>
	);
}

interface EntityListItemProps {
	entity: Entity;
	rank: number;
}

function EntityListItem({ entity, rank }: EntityListItemProps) {
	return (
		<div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors cursor-pointer">
			{/* Rank */}
			<span
				className={`
        text-sm font-semibold w-5 text-center
        ${rank <= 3 ? "text-primary" : "text-muted-foreground"}
      `}
			>
				{rank}
			</span>

			{/* Entity info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium truncate">{entity.name}</span>
					<EntityTypeBadge type={entity.type} />
				</div>
			</div>

			{/* Mention count */}
			<span className="text-xs text-muted-foreground">
				{entity.mentionCount}
			</span>
		</div>
	);
}

function EntityTypeBadge({ type }: { type: Entity["type"] }) {
	const typeLabels: Record<Entity["type"], string> = {
		person: "人物",
		organization: "组织",
		product: "产品",
		location: "地点",
		event: "事件",
		other: "其他",
	};

	return (
		<Badge variant="outline" className="text-xs px-1.5 py-0">
			{typeLabels[type] || type}
		</Badge>
	);
}

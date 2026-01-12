import { Badge } from "@/components/ui/badge";
import { WidgetLoadingState, WidgetWithStates } from "@/components/widgets";
import { type Entity, entitiesApi } from "@/lib/api/entities";
import { useContentHomeStore } from "@/store/content-home-store";
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
	const { dateRange, filters } = useContentHomeStore();

	const query = useQuery({
		queryKey: entitiesApi.queryKeys.trending({
			limit: 10,
			category: filters.category,
			from: dateRange.from?.toISOString(),
			to: dateRange.to?.toISOString(),
		}),
		queryFn: () =>
			entitiesApi.getTrending({
				limit: 10,
				category: filters.category,
				from: dateRange.from?.toISOString(),
				to: dateRange.to?.toISOString(),
			}),
	});

	return (
		<WidgetWithStates
			query={query}
			title="趋势实体"
			icon={<TrendingUp className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
			loading={<WidgetLoadingState lines={5} />}
			empty={{ message: "暂无趋势实体", iconType: "entities" }}
		>
			{({ data: entities }) => (
				<div className="space-y-2">
					{entities.map((entity, index) => (
						<EntityListItem key={entity.id} entity={entity} rank={index + 1} />
					))}
				</div>
			)}
		</WidgetWithStates>
	);
}

interface EntityListItemProps {
	entity: Entity;
	rank: number;
}

function EntityListItem({ entity, rank }: EntityListItemProps) {
	const { filters, setFilters } = useContentHomeStore();
	const isSelected = filters.entityIds?.includes(entity.id) || false;

	const handleClick = () => {
		const currentEntityIds = filters.entityIds || [];
		if (isSelected) {
			// 取消选择：移除该实体
			setFilters({
				entityIds: currentEntityIds.filter((id) => id !== entity.id),
			});
		} else {
			// 添加选择：添加该实体
			setFilters({
				entityIds: [...currentEntityIds, entity.id],
			});
		}
	};

	return (
		<div
			onClick={handleClick}
			className={`
				flex items-center gap-2 px-2 py-1.5 rounded transition-colors cursor-pointer
				${
					isSelected
						? "bg-primary/10 border-l-2 border-l-primary"
						: "hover:bg-accent border-l-2 border-l-transparent"
				}
			`}
		>
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

function EntityTypeBadge({ type }: { type: string }) {
	// 支持动态类型，提供常见类型的中文翻译
	const typeLabels: Record<string, string> = {
		person: "人物",
		organization: "组织",
		product: "产品",
		location: "地点",
		event: "事件",
		other: "其他",
		// 数据库中实际使用的类型
		tool: "工具",
		project: "项目",
		library: "库",
		article: "文章",
		company: "公司",
	};

	const label = typeLabels[type] || type;

	return (
		<Badge variant="outline" className="text-xs px-1.5 py-0">
			{label}
		</Badge>
	);
}

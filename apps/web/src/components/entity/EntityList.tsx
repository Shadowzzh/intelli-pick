import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, queryKeys } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { EntityItem } from "./EntityItem";

interface Entity {
	id: string;
	name: string;
	type: string;
	mentionCount: number;
	lastMentionedAt: string;
}

export function EntityList() {
	const { data: entities, isLoading } = useQuery<Entity[]>({
		queryKey: queryKeys.entities,
		queryFn: async () => {
			const result = await api.graphql<{ entities: Entity[] }>(`
        query GetEntities {
          entities {
            id
            name
            type
            mentionCount
            lastMentionedAt
          }
        }
      `);
			return result.entities;
		},
	});

	const grouped = entities?.reduce(
		(acc, entity) => {
			if (!acc[entity.type]) acc[entity.type] = [];
			acc[entity.type].push(entity);
			return acc;
		},
		{} as Record<string, Entity[]>,
	);

	if (isLoading) {
		return <div className="text-center py-4">加载中...</div>;
	}

	return (
		<Card className="widget">
			<div className="widget-header">
				<h2>实体</h2>
			</div>
			<div className="widget-content">
				<Tabs defaultValue="all">
					<TabsList className="w-full">
						<TabsTrigger value="all">全部</TabsTrigger>
						<TabsTrigger value="person">人物</TabsTrigger>
						<TabsTrigger value="organization">组织</TabsTrigger>
						<TabsTrigger value="product">产品</TabsTrigger>
					</TabsList>

					<TabsContent value="all" className="mt-3 space-y-2">
						{entities?.map((entity) => (
							<EntityItem key={entity.id} entity={entity} />
						))}
					</TabsContent>

					{grouped &&
						(Object.entries(grouped) as [string, Entity[]][]).map(
							([type, items]) => (
								<TabsContent key={type} value={type} className="mt-3 space-y-2">
									{items.map((entity) => (
										<EntityItem key={entity.id} entity={entity} />
									))}
								</TabsContent>
							),
						)}
				</Tabs>
			</div>
		</Card>
	);
}

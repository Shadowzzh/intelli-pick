import { Badge } from "@/components/ui/badge";

interface Entity {
	id: string;
	name: string;
	type: string;
	mentionCount: number;
	lastMentionedAt: string;
}

interface EntityItemProps {
	entity: Entity;
	onClick?: () => void;
}

export function EntityItem({ entity, onClick }: EntityItemProps) {
	return (
		<button
			type="button"
			className="w-full p-2 hover:bg-muted rounded cursor-pointer transition-colors text-left"
			onClick={onClick}
		>
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium truncate">{entity.name}</div>
					<div className="text-xs text-muted-foreground">
						{entity.mentionCount} 次提及
					</div>
				</div>
				<Badge variant="outline" className="text-xs ml-2">
					{entity.type}
				</Badge>
			</div>
		</button>
	);
}

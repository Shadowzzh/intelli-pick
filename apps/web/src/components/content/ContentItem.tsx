import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Source {
	name: string;
	type: string;
}

interface Entity {
	id: string;
	name: string;
	type: string;
}

interface Content {
	id: string;
	title: string;
	summary: string;
	url: string;
	source: Source;
	entities: Entity[];
	aiScore?: number;
	publishedAt: string;
}

interface ContentItemProps {
	content: Content;
	onClick?: () => void;
}

function getSourceIcon(type: string): string {
	const icons: Record<string, string> = {
		rss: "📰",
		twitter: "🐦",
		v2ex: "💬",
	};
	return icons[type] || "📄";
}

export function ContentItem({ content, onClick }: ContentItemProps) {
	return (
		<Card
			className="p-3 hover:shadow-md transition-all cursor-pointer group"
			onClick={onClick}
		>
			<div className="flex items-start gap-2 mb-2">
				<div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
					<span className="text-lg">{getSourceIcon(content.source.type)}</span>
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
						{content.title}
					</h3>
				</div>

				{content.aiScore && (
					<div className="flex-shrink-0">
						<Badge variant="secondary" className="text-xs">
							⭐ {content.aiScore.toFixed(1)}
						</Badge>
					</div>
				)}
			</div>

			<p className="text-xs text-muted-foreground line-clamp-2 mb-2 pl-10">
				{content.summary}
			</p>

			<div className="flex items-center gap-2 pl-10">
				<span className="text-xs text-muted-foreground">
					{content.source.name}
				</span>
				<span className="text-xs text-muted-foreground">·</span>
				<span className="text-xs text-muted-foreground">
					{formatDistanceToNow(new Date(Number(content.publishedAt)), {
						addSuffix: true,
						locale: zhCN,
					})}
				</span>

				{content.entities.length > 0 && (
					<div className="flex-1 flex items-center gap-1 overflow-hidden ml-2">
						<div className="flex gap-1 overflow-x-auto">
							{content.entities.slice(0, 3).map((entity) => (
								<Badge
									key={entity.id}
									variant="outline"
									className="text-xs whitespace-nowrap"
								>
									{entity.name}
								</Badge>
							))}
							{content.entities.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{content.entities.length - 3}
								</Badge>
							)}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}

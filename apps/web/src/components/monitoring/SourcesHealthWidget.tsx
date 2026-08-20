import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import type { SourceHealthResponseData } from "@intellipick/shared";
import { Database } from "lucide-react";
import { getTimeStatus } from "./styles";

interface SourcesHealthWidgetProps {
	data?: SourceHealthResponseData;
}

export function SourcesHealthWidget({ data }: SourcesHealthWidgetProps) {
	if (!data || !data.sources || data.sources.length === 0) {
		return (
			<Widget title="数据源健康" icon={<Database className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无数据源" iconType="default" />
			</Widget>
		);
	}

	return (
		<Widget
			title="数据源健康"
			icon={<Database className="h-4 w-4" />}
			contentClassName="space-y-2"
		>
			<div className="space-y-2 max-h-[400px] overflow-auto">
				{data.sources.map((source) => {
					const timeStatus = getTimeStatus(source.lastCollectedAt ?? null);

					return (
						<div
							key={source.id}
							className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
						>
							<div className="flex items-start gap-2">
								<div className="flex-1 min-w-0">
									<div className="font-medium truncate text-sm">
										{source.name}
									</div>
									<div className="text-xs text-muted-foreground truncate">
										{source.type}
									</div>
									<div className="text-xs mt-1 flex items-center gap-1">
										<span className="text-muted-foreground">最后:</span>
										<span className={timeStatus.color}>{timeStatus.text}</span>
									</div>
								</div>
								<Badge
									variant={source.enabled ? "default" : "secondary"}
									className="shrink-0 text-xs"
								>
									{source.enabled ? "启用" : "禁用"}
								</Badge>
							</div>
						</div>
					);
				})}
			</div>
		</Widget>
	);
}

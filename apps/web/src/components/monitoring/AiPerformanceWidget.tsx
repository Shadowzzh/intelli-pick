import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import type { AiPerformanceMetrics } from "@intellipick/shared";
import { Zap } from "lucide-react";
import { getAiLabel, getAiStatus, statusToBadgeVariant } from "./styles";

interface AiPerformanceWidgetProps {
	data?: AiPerformanceMetrics;
}

export function AiPerformanceWidget({ data }: AiPerformanceWidgetProps) {
	if (!data) {
		return (
			<Widget title="AI 性能" icon={<Zap className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无数据" iconType="default" />
			</Widget>
		);
	}

	return (
		<Widget
			title="AI 性能"
			icon={<Zap className="h-4 w-4" />}
			contentClassName="space-y-3"
		>
			{/* 过滤服务 */}
			<div className="p-3 rounded-lg border bg-muted/30">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium">过滤服务</span>
					<Badge
						variant={statusToBadgeVariant(getAiStatus(data.filterSuccessRate))}
					>
						{getAiLabel(data.filterSuccessRate)}
					</Badge>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<div className="text-xs text-muted-foreground">调用次数</div>
						<div className="text-lg font-semibold">{data.filterCalls}</div>
					</div>
					<div>
						<div className="text-xs text-muted-foreground">成功率</div>
						<div className="text-lg font-semibold">
							{(data.filterSuccessRate * 100).toFixed(1)}%
						</div>
					</div>
				</div>
			</div>

			{/* 实体提取服务 */}
			<div className="p-3 rounded-lg border bg-muted/30">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium">实体提取</span>
					<Badge
						variant={statusToBadgeVariant(getAiStatus(data.extractSuccessRate))}
					>
						{getAiLabel(data.extractSuccessRate)}
					</Badge>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<div className="text-xs text-muted-foreground">调用次数</div>
						<div className="text-lg font-semibold">{data.extractCalls}</div>
					</div>
					<div>
						<div className="text-xs text-muted-foreground">成功率</div>
						<div className="text-lg font-semibold">
							{(data.extractSuccessRate * 100).toFixed(1)}%
						</div>
					</div>
				</div>
			</div>

			{/* 性能指标 - 底部汇总 */}
			<div className="pt-3 border-t grid grid-cols-2 gap-3">
				<div className="text-center p-2 rounded bg-muted/20">
					<div className="text-xs text-muted-foreground">平均响应</div>
					<div className="text-xl font-bold">
						{data.avgResponseTime.toFixed(0)}ms
					</div>
				</div>
				<div className="text-center p-2 rounded bg-muted/20">
					<div className="text-xs text-muted-foreground">通过率</div>
					<div className="text-xl font-bold">
						{(data.passRate * 100).toFixed(1)}%
					</div>
				</div>
			</div>
		</Widget>
	);
}

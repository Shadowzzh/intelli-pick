import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { Activity, Database, Layers, TrendingUp } from "lucide-react";
import { MetricItem } from "./MetricItem";
import { MetricItemSkeleton } from "./MetricItemSkeleton";

interface OverviewWidgetProps {
	data?: {
		totalContents: number;
		todayNew: number;
		queueWaiting: number;
		queueActive: number;
		systemStatus: "healthy" | "warning" | "error";
	};
	isLoading?: boolean;
}

export function OverviewWidget({ data, isLoading }: OverviewWidgetProps) {
	// 加载状态
	if (isLoading) {
		return (
			<Widget title="系统概览">
				<div className="grid grid-cols-1 divide-y border rounded-lg overflow-hidden">
					{[1, 2, 3, 4].map((i) => (
						<MetricItemSkeleton key={i} />
					))}
				</div>
			</Widget>
		);
	}

	// 空状态
	if (!data) {
		return (
			<Widget title="系统概览">
				<WidgetEmptyState message="暂无概览数据" iconType="default" />
			</Widget>
		);
	}

	// 计算队列总数
	const queueTotal = data.queueWaiting + data.queueActive;

	// 系统状态映射
	const statusMap = {
		healthy: { label: "正常", variant: "success" as const },
		warning: { label: "警告", variant: "warning" as const },
		error: { label: "异常", variant: "error" as const },
	};
	const systemStatus = statusMap[data.systemStatus];

	return (
		<Widget title="系统概览">
			<div className="grid grid-cols-1 divide-y border rounded-lg overflow-hidden">
				{/* 总内容数 */}
				<MetricItem
					label="总内容数"
					value={data.totalContents}
					icon={<Database className="size-4" />}
				/>

				{/* 今日新增 */}
				<MetricItem
					label="今日新增"
					value={`+${data.todayNew}`}
					variant="success"
					icon={<TrendingUp className="size-4" />}
				/>

				{/* 队列任务 */}
				<MetricItem
					label="队列中任务"
					value={queueTotal}
					icon={<Layers className="size-4" />}
				/>

				{/* 系统状态 */}
				<MetricItem
					label="系统状态"
					value={systemStatus.label}
					variant={systemStatus.variant}
					icon={<Activity className="size-4" />}
				/>
			</div>
		</Widget>
	);
}

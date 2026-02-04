import { Column } from "@/components/layout/Column";
import { PageHeader } from "@/components/layout/PageHeader";
import { AiPerformanceWidget } from "@/components/monitoring/AiPerformanceWidget";
import { QueueDetailWidget } from "@/components/monitoring/QueueDetailWidget";
import { SourcesHealthWidget } from "@/components/monitoring/SourcesHealthWidget";
import { StatusIndicator } from "@/components/monitoring/StatusIndicator";
import { SystemResourcesWidget } from "@/components/monitoring/SystemResourcesWidget";
import { Widget } from "@/components/widgets/Widget";
import { WidgetLoadingState } from "@/components/widgets/WidgetLoadingState";
import { useMonitoring } from "@/hooks/useMonitoring";
import { Activity, Database, Layers, TrendingUp } from "lucide-react";

export function MonitoringPage() {
	const { data, isLoading } = useMonitoring();

	return (
		<div className="min-h-screen bg-background text-foreground p-4 md:p-6">
			<div className="w-full">
				<PageHeader />

				{/* 系统健康总览 - 4 个指标卡片 */}
				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
						{[1, 2, 3, 4].map((i) => (
							<Widget key={i} title="加载中...">
								<WidgetLoadingState lines={1} variant="card" />
							</Widget>
						))}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
						{/* 总内容数卡片 */}
						<Widget title="总内容数" icon={<Database className="h-4 w-4" />}>
							<div className="text-center py-2">
								<div className="text-4xl font-bold tracking-tight">
									{data?.overview.totalContents.toLocaleString()}
								</div>
							</div>
						</Widget>

						{/* 今日新增卡片 */}
						<Widget title="今日新增" icon={<TrendingUp className="h-4 w-4" />}>
							<div className="text-center py-2">
								<div className="text-4xl font-bold text-green-500">
									+{data?.overview.todayNew || 0}
								</div>
								<div className="text-sm text-muted-foreground mt-1">新内容</div>
							</div>
						</Widget>

						{/* 队列任务卡片 */}
						<Widget title="队列任务" icon={<Layers className="h-4 w-4" />}>
							<div className="space-y-3 py-2">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">等待</span>
									<span className="text-xl font-bold text-blue-500">
										{data?.overview.queueWaiting || 0}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">处理中</span>
									<span className="text-xl font-bold text-orange-500">
										{data?.overview.queueActive || 0}
									</span>
								</div>
							</div>
						</Widget>

						{/* 系统状态卡片 */}
						<Widget title="系统状态" icon={<Activity className="h-4 w-4" />}>
							<div className="flex items-center justify-center py-2">
								<StatusIndicator
									status={data?.overview.systemStatus ?? "warning"}
									variant="badge"
									size="lg"
								/>
							</div>
						</Widget>
					</div>
				)}

				{/* 监控面板 - 4 列布局 */}
				<div className="flex flex-col lg:flex-row gap-5">
					<Column size="small">
						<SystemResourcesWidget data={data?.systemResources} />
					</Column>
					<Column size="medium">
						<QueueDetailWidget data={data?.queue} />
					</Column>
					<Column size="small">
						<SourcesHealthWidget data={data?.sources} />
					</Column>
					<Column size="small">
						<AiPerformanceWidget data={data?.aiPerformance} />
					</Column>
				</div>
			</div>
		</div>
	);
}

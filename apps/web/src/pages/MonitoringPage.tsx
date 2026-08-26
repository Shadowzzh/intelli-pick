import { Column } from "@/components/layout/Column";
import { PageHeader } from "@/components/layout/PageHeader";
import { AiPerformanceWidget } from "@/components/monitoring/AiPerformanceWidget";
import { JobHistoryWidget } from "@/components/monitoring/JobHistoryWidget";
import { OverviewWidget } from "@/components/monitoring/OverviewWidget";
import { QueueDetailWidget } from "@/components/monitoring/QueueDetailWidget";
import { SourcesHealthWidget } from "@/components/monitoring/SourcesHealthWidget";
import { SystemResourcesWidget } from "@/components/monitoring/SystemResourcesWidget";
import { useMonitoring } from "@/hooks/useMonitoring";

export function MonitoringPage() {
	const { data, isLoading } = useMonitoring();

	return (
		<div className="min-h-screen bg-background text-foreground p-4 md:p-6">
			<div className="w-full">
				<PageHeader />

				{/* 监控面板 - 4 列非对称布局 */}
				<div className="flex flex-col lg:flex-row gap-5">
					{/* 第1列：系统概览 + 系统资源 */}
					<Column size="small">
						<div className="mb-5">
							<OverviewWidget data={data?.overview} isLoading={isLoading} />
						</div>
						<SystemResourcesWidget data={data?.systemResources} />
					</Column>

					{/* 第2列：队列详情 */}
					<Column size="medium">
						<div className="space-y-5">
							<QueueDetailWidget data={data?.queue} />
							<JobHistoryWidget />
						</div>
					</Column>

					{/* 第3列：数据源健康 */}
					<Column size="small">
						<SourcesHealthWidget data={data?.sources} />
					</Column>

					{/* 第4列：AI性能 */}
					<Column size="small">
						<AiPerformanceWidget data={data?.aiPerformance} />
					</Column>
				</div>
			</div>
		</div>
	);
}

import { Progress } from "@/components/ui/progress";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import type { SystemResourceMetrics } from "@intellipick/shared";
import { AlertTriangle, Cpu, Server } from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";

interface SystemResourcesWidgetProps {
	data?: SystemResourceMetrics;
}

export function SystemResourcesWidget({ data }: SystemResourcesWidgetProps) {
	if (!data) {
		return (
			<Widget title="系统资源" icon={<Server className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无数据" />
			</Widget>
		);
	}

	return (
		<Widget
			title="系统资源"
			icon={<Server className="h-4 w-4" />}
			contentClassName="space-y-4"
		>
			{/* 数据库状态 */}
			<div className="p-3 rounded-lg border bg-muted/30">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Cpu className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm font-medium">数据库</span>
					</div>
					<StatusIndicator
						status={data.database.status === "connected" ? "healthy" : "error"}
						variant="badge"
						label={data.database.status === "connected" ? "已连接" : "未连接"}
					/>
				</div>
				{data.database.connectionCount !== undefined && (
					<div className="text-xs text-muted-foreground">
						连接数: {data.database.connectionCount}
					</div>
				)}
			</div>

			{/* Redis 状态 */}
			<div className="p-3 rounded-lg border bg-muted/30">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Server className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm font-medium">Redis</span>
					</div>
					<StatusIndicator
						status={data.redis.status === "connected" ? "healthy" : "error"}
						variant="badge"
						label={data.redis.status === "connected" ? "已连接" : "未连接"}
					/>
				</div>
				{data.redis.memoryUsage !== undefined &&
					data.redis.memoryLimit !== undefined && (
						<div className="space-y-2">
							<div className="relative">
								<Progress
									value={
										(data.redis.memoryUsage / data.redis.memoryLimit) * 100
									}
									className="h-2"
								/>
								{(data.redis.memoryUsage / data.redis.memoryLimit) * 100 >
									80 && (
									<AlertTriangle className="absolute -right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
								)}
							</div>
							<div className="text-xs text-muted-foreground">
								内存: {(data.redis.memoryUsage / 1024 / 1024).toFixed(2)} MB /{" "}
								{(data.redis.memoryLimit / 1024 / 1024).toFixed(2)} MB
							</div>
						</div>
					)}
			</div>

			{/* API 统计 */}
			<div className="p-3 rounded-lg border bg-muted/30">
				<div className="text-sm font-medium mb-2">API 统计</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<div className="text-xs text-muted-foreground">请求数</div>
						<div className="text-lg font-semibold">{data.api.requestCount}</div>
					</div>
					<div>
						<div className="text-xs text-muted-foreground">响应时间</div>
						<div className="text-lg font-semibold">
							{data.api.avgResponseTime.toFixed(0)}ms
						</div>
					</div>
				</div>
			</div>
		</Widget>
	);
}

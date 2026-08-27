import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import type { SystemResourceMetrics } from "@intellipick/shared";
import { AlertTriangle, Cpu, Server } from "lucide-react";

interface SystemResourcesWidgetProps {
	data?: SystemResourceMetrics;
}

function formatMemory(bytes: number): string {
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function SystemResourcesWidget({ data }: SystemResourcesWidgetProps) {
	if (!data) {
		return (
			<Widget title="依赖与 API 状态" icon={<Server className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无数据" />
			</Widget>
		);
	}

	const isDatabaseConnected = data.database.status === "connected";
	const isRedisConnected = data.redis.status === "connected";

	let memoryUsagePercent = 0;
	const memoryUsage = data.redis.memoryUsage;
	const memoryLimit = data.redis.memoryLimit;
	const hasMemoryUsage = memoryUsage !== undefined;
	const hasMemoryLimit = memoryLimit !== undefined && memoryLimit > 0;
	if (
		memoryUsage !== undefined &&
		memoryLimit !== undefined &&
		memoryLimit > 0
	) {
		memoryUsagePercent = (memoryUsage / memoryLimit) * 100;
	}

	const showMemoryWarning = hasMemoryLimit && memoryUsagePercent > 80;
	let memoryLabel = "";
	if (memoryUsage !== undefined) {
		memoryLabel = `内存：${formatMemory(memoryUsage)}`;
		if (memoryLimit !== undefined && memoryLimit > 0) {
			memoryLabel += ` / ${formatMemory(memoryLimit)}`;
		} else {
			memoryLabel += " / 未设置上限";
		}
	}
	const apiErrorRate = `${(data.api.errorRate * 100).toFixed(1)}%`;

	return (
		<Widget
			title="依赖与 API 状态"
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
					<Badge variant={isDatabaseConnected ? "success" : "error"}>
						{isDatabaseConnected ? "已连接" : "未连接"}
					</Badge>
				</div>
				{data.database.connectionCount !== undefined && (
					<div className="text-xs text-muted-foreground">
						连接数：{data.database.connectionCount}
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
					<Badge variant={isRedisConnected ? "success" : "error"}>
						{isRedisConnected ? "已连接" : "未连接"}
					</Badge>
				</div>
				{hasMemoryUsage && (
					<div className="space-y-2">
						{hasMemoryLimit && (
							<div className="relative">
								<Progress value={memoryUsagePercent} className="h-2" />
								{showMemoryWarning && (
									<AlertTriangle className="absolute -right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
								)}
							</div>
						)}
						<div className="text-xs text-muted-foreground">{memoryLabel}</div>
					</div>
				)}
			</div>

			{/* API 统计 */}
			<div className="p-3 rounded-lg border bg-muted/30">
				<div className="flex items-center justify-between gap-2 mb-2">
					<div className="text-sm font-medium">API 统计</div>
					<div className="text-xs text-muted-foreground">
						近 {data.api.windowMinutes} 分钟
					</div>
				</div>
				<div className="divide-y text-sm">
					<div className="flex items-center justify-between py-1.5">
						<span className="text-muted-foreground">业务请求数</span>
						<span className="font-semibold tabular-nums">
							{data.api.requestCount.toLocaleString()}
						</span>
					</div>
					<div className="flex items-center justify-between py-1.5">
						<span className="text-muted-foreground">平均响应</span>
						<span className="font-semibold tabular-nums">
							{data.api.avgResponseTime.toFixed(0)}ms
						</span>
					</div>
					<div className="flex items-center justify-between py-1.5">
						<span className="text-muted-foreground">服务端错误率</span>
						<span className="font-semibold tabular-nums">{apiErrorRate}</span>
					</div>
				</div>
			</div>
		</Widget>
	);
}

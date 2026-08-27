import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { useSourceEnabledMutation } from "@/hooks/useMonitoring";
import {
	type SourceHealthResponseData,
	SourceHealthStatus,
	type SourceStatus,
} from "@intellipick/shared";
import { Database, Loader2, Power, PowerOff } from "lucide-react";

interface SourcesHealthWidgetProps {
	data?: SourceHealthResponseData;
}

type HealthBadgeVariant = "success" | "warning" | "error" | "secondary";

function getHealthPresentation(source: SourceStatus): {
	label: string;
	variant: HealthBadgeVariant;
} {
	if (source.lastFetchStatus === "running") {
		return { label: "采集中", variant: "warning" };
	}

	switch (source.healthStatus) {
		case SourceHealthStatus.HEALTHY:
			return { label: "健康", variant: "success" };
		case SourceHealthStatus.DELAYED:
			return { label: "延迟", variant: "warning" };
		case SourceHealthStatus.ERROR:
			return { label: "失败", variant: "error" };
		case SourceHealthStatus.PENDING:
			return { label: "等待首次采集", variant: "secondary" };
		case SourceHealthStatus.DISABLED:
			return { label: "已停用", variant: "secondary" };
	}
}

function formatRelativeTime(value: Date | string | null): string {
	if (!value) {
		return "尚无成功记录";
	}

	const date = typeof value === "string" ? new Date(value) : value;
	const diffMs = Date.now() - date.getTime();
	const minutes = Math.floor(diffMs / (60 * 1000));
	if (minutes < 1) {
		return "刚刚";
	}
	if (minutes < 60) {
		return `${minutes} 分钟前`;
	}

	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours} 小时前`;
	}

	const days = Math.floor(hours / 24);
	if (days < 7) {
		return `${days} 天前`;
	}
	if (days < 30) {
		return `${Math.floor(days / 7)} 周前`;
	}
	return `${Math.floor(days / 30)} 个月前`;
}

function formatDuration(value: number | null): string | null {
	if (value === null) {
		return null;
	}
	if (value < 1000) {
		return `${value}ms`;
	}
	return `${(value / 1000).toFixed(1)}s`;
}

function formatInterval(seconds: number): string {
	if (seconds % 3600 === 0) {
		return `${seconds / 3600} 小时`;
	}
	return `${Math.round(seconds / 60)} 分钟`;
}

export function SourcesHealthWidget({ data }: SourcesHealthWidgetProps) {
	const toggleMutation = useSourceEnabledMutation();

	if (!data || !data.sources || data.sources.length === 0) {
		return (
			<Widget title="数据源健康" icon={<Database className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无数据源" iconType="default" />
			</Widget>
		);
	}
	const enabledCount = data.sources.filter((source) => source.enabled).length;

	return (
		<Widget
			title="数据源健康"
			icon={<Database className="h-4 w-4" />}
			actions={
				<div className="flex items-center gap-1.5">
					<Badge variant="outline" className="text-xs">
						总数 {data.summary.total}
					</Badge>
					<Badge variant="success" className="text-xs">
						启用 {enabledCount}
					</Badge>
				</div>
			}
			contentClassName="space-y-2"
		>
			{toggleMutation.isError && (
				<div
					role="alert"
					className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400"
				>
					更新数据源状态失败，请重试。
				</div>
			)}

			<div className="space-y-2 max-h-[520px] overflow-auto">
				{data.sources.map((source) => {
					const health = getHealthPresentation(source);
					const isPending =
						toggleMutation.isPending &&
						toggleMutation.variables?.id === source.id;
					const duration = formatDuration(source.lastDurationMs);
					const actionLabel = source.enabled
						? `停用 ${source.name}`
						: `启用 ${source.name}`;
					let buttonClassName =
						"cursor-pointer text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";
					if (!source.enabled) {
						buttonClassName =
							"cursor-pointer text-green-600 hover:bg-green-500/10 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300";
					}
					let actionIcon = <Power />;
					if (isPending) {
						actionIcon = <Loader2 className="animate-spin" />;
					} else if (source.enabled) {
						actionIcon = <PowerOff />;
					}

					return (
						<div
							key={source.id}
							className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
						>
							<div className="flex items-start gap-3">
								<div className="flex-1 min-w-0 space-y-2">
									<div>
										<div className="font-medium truncate text-sm">
											{source.name}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{source.type} · 每 {formatInterval(source.fetchInterval)}
										</div>
									</div>

									<div className="text-xs text-muted-foreground space-y-1">
										<div>
											最后成功：{formatRelativeTime(source.lastFetchedAt)}
										</div>
										{source.lastItemCount !== null && (
											<div>
												拉取 {source.lastItemCount} 条，新增{" "}
												{source.lastNewCount ?? 0}
												{duration ? `，耗时 ${duration}` : ""}
											</div>
										)}
										{source.lastFetchError && (
											<div className="text-red-600 dark:text-red-400 line-clamp-2">
												{source.lastFetchError}
											</div>
										)}
									</div>
								</div>

								<div className="flex shrink-0 flex-col items-end gap-2">
									<Badge variant={health.variant} className="text-xs">
										{health.label}
									</Badge>
									<Button
										type="button"
										size="icon-sm"
										variant="ghost"
										className={buttonClassName}
										disabled={toggleMutation.isPending}
										aria-label={actionLabel}
										title={actionLabel}
										onClick={() =>
											toggleMutation.mutate({
												id: source.id,
												enabled: !source.enabled,
											})
										}
									>
										{actionIcon}
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Widget>
	);
}

import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import type {
	AiPerformanceMetrics,
	AiTaskPerformanceMetrics,
} from "@intellipick/shared";
import { Zap } from "lucide-react";
import { getAiLabel, getAiStatus, statusToBadgeVariant } from "./styles";

interface AiPerformanceWidgetProps {
	data?: AiPerformanceMetrics;
}

const numberFormatter = new Intl.NumberFormat("zh-CN");
const compactNumberFormatter = new Intl.NumberFormat("zh-CN", {
	notation: "compact",
	maximumFractionDigits: 1,
});
const decimalFormatter = new Intl.NumberFormat("zh-CN", {
	maximumFractionDigits: 1,
});

function formatNumber(value: number): string {
	return numberFormatter.format(Math.round(value));
}

function formatRate(value: number | null): string {
	if (value === null) {
		return "--";
	}
	return `${(value * 100).toFixed(1)}%`;
}

function formatDuration(value: number | null): string {
	if (value === null) {
		return "--";
	}
	return `${formatNumber(value)}ms`;
}

function formatCompactNumber(value: number): string {
	if (Math.abs(value) < 10_000) {
		return formatNumber(value);
	}
	return compactNumberFormatter.format(value);
}

function formatCompactDuration(value: number | null): string {
	if (value === null) {
		return "--";
	}

	if (value < 1_000) {
		return `${formatNumber(value)}ms`;
	}

	const seconds = value / 1_000;
	if (seconds < 60) {
		return `${decimalFormatter.format(seconds)}秒`;
	}

	const minutes = seconds / 60;
	if (minutes < 60) {
		return `${decimalFormatter.format(minutes)}分钟`;
	}

	return `${decimalFormatter.format(minutes / 60)}小时`;
}

function AiStatusBadge({ successRate }: { successRate: number | null }) {
	if (successRate === null) {
		return <Badge variant="secondary">暂无数据</Badge>;
	}

	return (
		<Badge variant={statusToBadgeVariant(getAiStatus(successRate))}>
			{getAiLabel(successRate)}
		</Badge>
	);
}

function AiTaskCard({
	title,
	data,
}: {
	title: string;
	data: AiTaskPerformanceMetrics;
}) {
	const configuredModels = data.configuredModels.join(", ") || "未配置";
	const responseModels = data.responseModels.join(", ");
	const providerDetails = [...data.providers, ...data.protocols].join(" · ");

	return (
		<div className="p-3 rounded-lg border bg-muted/30 space-y-3">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium">{title}</span>
				<AiStatusBadge successRate={data.successRate} />
			</div>

			<div className="space-y-1 text-xs text-muted-foreground">
				<div className="break-all">配置模型：{configuredModels}</div>
				{responseModels && (
					<div className="break-all">响应模型：{responseModels}</div>
				)}
				{providerDetails && <div>{providerDetails}</div>}
			</div>

			<div className="grid grid-cols-3 gap-2">
				<div>
					<div className="text-xs text-muted-foreground">调用次数</div>
					<div className="text-lg font-semibold">
						{formatNumber(data.calls)}
					</div>
				</div>
				<div>
					<div className="text-xs text-muted-foreground">成功率</div>
					<div className="text-lg font-semibold">
						{formatRate(data.successRate)}
					</div>
				</div>
				<div>
					<div className="text-xs text-muted-foreground">平均响应</div>
					<div className="text-lg font-semibold">
						{formatDuration(data.avgResponseTime)}
					</div>
				</div>
			</div>

			<div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
				<div className="flex flex-wrap gap-x-3 gap-y-1">
					<span>输入 {formatNumber(data.promptTokens)}</span>
					<span>输出 {formatNumber(data.completionTokens)}</span>
					<span>总计 {formatNumber(data.totalTokens)}</span>
				</div>
				{(data.cachedPromptTokens > 0 || data.reasoningTokens > 0) && (
					<div className="flex flex-wrap gap-x-3 gap-y-1">
						<span>缓存 {formatNumber(data.cachedPromptTokens)}</span>
						<span>推理 {formatNumber(data.reasoningTokens)}</span>
					</div>
				)}
			</div>
		</div>
	);
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
			title={`AI 性能（近 ${data.windowHours} 小时）`}
			icon={<Zap className="h-4 w-4" />}
			contentClassName="space-y-3"
		>
			<AiTaskCard title="实体提取与分类" data={data.extract} />

			<div className="pt-3 border-t grid min-w-0 grid-cols-2 gap-2">
				<div
					className="col-span-full min-w-0 overflow-hidden text-center p-2 rounded bg-muted/20"
					title={`总 Token：${formatNumber(data.extract.totalTokens)}`}
				>
					<div className="text-xs text-muted-foreground">总 Token</div>
					<div className="truncate whitespace-nowrap text-xl font-bold tabular-nums">
						{formatCompactNumber(data.extract.totalTokens)}
					</div>
				</div>
				<div
					className="min-w-0 overflow-hidden text-center p-2 rounded bg-muted/20"
					title={`平均响应：${formatDuration(data.extract.avgResponseTime)}`}
				>
					<div className="text-xs text-muted-foreground">平均响应</div>
					<div className="truncate whitespace-nowrap text-lg font-bold tabular-nums">
						{formatCompactDuration(data.extract.avgResponseTime)}
					</div>
				</div>
				<div
					className="min-w-0 overflow-hidden text-center p-2 rounded bg-muted/20"
					title={`成功率：${formatRate(data.extract.successRate)}`}
				>
					<div className="text-xs text-muted-foreground">成功率</div>
					<div className="truncate whitespace-nowrap text-lg font-bold tabular-nums">
						{formatRate(data.extract.successRate)}
					</div>
				</div>
			</div>
		</Widget>
	);
}

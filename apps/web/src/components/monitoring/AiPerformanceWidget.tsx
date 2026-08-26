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
			<AiTaskCard title="过滤服务" data={data.filter} />
			<AiTaskCard title="实体提取" data={data.extract} />

			<div className="pt-3 border-t grid grid-cols-3 gap-3">
				<div className="text-center p-2 rounded bg-muted/20">
					<div className="text-xs text-muted-foreground">总 Token</div>
					<div className="text-xl font-bold">
						{formatNumber(data.totalTokens)}
					</div>
				</div>
				<div className="text-center p-2 rounded bg-muted/20">
					<div className="text-xs text-muted-foreground">平均响应</div>
					<div className="text-xl font-bold">
						{formatDuration(data.avgResponseTime)}
					</div>
				</div>
				<div className="text-center p-2 rounded bg-muted/20">
					<div className="text-xs text-muted-foreground">通过率</div>
					<div className="text-xl font-bold">
						{formatRate(data.filter.passRate)}
					</div>
				</div>
			</div>
		</Widget>
	);
}

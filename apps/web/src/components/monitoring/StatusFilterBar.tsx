// apps/web/src/components/monitoring/StatusFilterBar.tsx
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { JobStatus } from "@intellipick/shared";

interface StatusFilterBarProps {
	value: JobStatus | "all";
	onChange: (value: JobStatus | "all") => void;
}

const STATUS_OPTIONS = [
	{ value: "all" as const, label: "全部" },
	{
		value: "waiting" as const,
		label: "等待中",

		description: "队列中等待处理的任务",
	},
	{ value: "active" as const, label: "处理中" },
	{
		value: "completed" as const,
		label: "已完成",
	},
	{ value: "failed" as const, label: "失败" },
	{ value: "delayed" as const, label: "延迟" },
];

export function StatusFilterBar({ value, onChange }: StatusFilterBarProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">状态:</span>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="h-8 w-">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{STATUS_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							<div className="flex flex-col">
								<span className="font-medium">{option.label}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

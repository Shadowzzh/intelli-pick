// apps/web/src/components/monitoring/StatusFilterBar.tsx
import type { JobStatus } from "@intellipick/shared";

interface StatusFilterBarProps {
	value: JobStatus | "all";
	onChange: (value: JobStatus | "all") => void;
}

const STATUS_OPTIONS = [
	{ value: "all" as const, label: "全部" },
	{ value: "waiting" as const, label: "等待中" },
	{ value: "active" as const, label: "处理中" },
	{ value: "completed" as const, label: "已完成" },
	{ value: "failed" as const, label: "失败" },
	{ value: "delayed" as const, label: "延迟" },
];

export function StatusFilterBar({ value, onChange }: StatusFilterBarProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">状态:</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value as JobStatus | "all")}
				className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				{STATUS_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}

import { cn } from "@/lib/utils";

interface MetricItemProps {
	label: string;
	value: string | number;
	variant?: "default" | "success" | "warning" | "error";
	icon?: React.ReactNode;
}

export function MetricItem({
	label,
	value,
	variant = "default",
	icon,
}: MetricItemProps) {
	const variantClasses = {
		default: "text-foreground",
		success: "text-green-600 dark:text-green-500",
		warning: "text-orange-600 dark:text-orange-500",
		error: "text-red-600 dark:text-red-500",
	};

	return (
		<div className="flex items-center justify-between px-6 py-4 transition-colors">
			{/* 左侧：图标和标签 */}
			<div className="flex items-center gap-3">
				{icon && <div className="text-muted-foreground">{icon}</div>}
				<span className="text-sm font-medium text-muted-foreground">
					{label}
				</span>
			</div>

			{/* 右侧：数值 */}
			<div
				className={cn(
					"font-bold tracking-tight tabular-nums",
					variantClasses[variant],
				)}
			>
				{typeof value === "number" ? value.toLocaleString() : value}
			</div>
		</div>
	);
}

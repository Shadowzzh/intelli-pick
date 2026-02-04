import { cn } from "@/lib/utils";
import { type StatusType, statusStyles } from "./styles";

interface StatusIndicatorProps {
	status: StatusType;
	variant?: "dot" | "badge" | "text";
	size?: "sm" | "md" | "lg";
	label?: string;
	className?: string;
}

export function StatusIndicator({
	status,
	variant = "dot",
	size = "md",
	label,
	className,
}: StatusIndicatorProps) {
	const styles = statusStyles[status];

	// 尺寸配置
	const sizeClasses = {
		dot: {
			sm: "w-1.5 h-1.5",
			md: "w-2 h-2",
			lg: "w-2.5 h-2.5",
		},
		badge: {
			sm: "px-2 py-0.5 text-xs gap-1",
			md: "px-2.5 py-1 text-xs gap-1.5",
			lg: "px-3 py-1.5 text-sm gap-2",
		},
		text: {
			sm: "text-xs",
			md: "text-sm",
			lg: "text-base",
		},
	};

	if (variant === "dot") {
		return (
			<div
				className={cn(
					"rounded-full",
					sizeClasses.dot[size],
					styles.text.replace("text-", "bg-"),
					className,
				)}
				title={label || status}
			/>
		);
	}

	if (variant === "badge") {
		return (
			<span
				className={cn(
					"inline-flex items-center rounded-full font-medium border",
					sizeClasses.badge[size],
					styles.bg,
					styles.border,
					styles.text,
					className,
				)}
			>
				<div
					className={cn(
						"rounded-full",
						size === "sm"
							? "w-1 h-1"
							: size === "md"
								? "w-1.5 h-1.5"
								: "w-2 h-2",
						styles.text.replace("text-", "bg-"),
					)}
				/>
				{label ||
					(status === "healthy"
						? "正常"
						: status === "warning"
							? "警告"
							: "错误")}
			</span>
		);
	}

	// variant === "text"
	return (
		<span
			className={cn(
				styles.text,
				"font-medium",
				sizeClasses.text[size],
				className,
			)}
		>
			{label ||
				(status === "healthy"
					? "正常"
					: status === "warning"
						? "警告"
						: "错误")}
		</span>
	);
}

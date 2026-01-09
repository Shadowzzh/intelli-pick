import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface WidgetProps {
	title: string;
	icon?: ReactNode;
	actions?: ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	children: ReactNode;
}

export function Widget({
	title,
	icon,
	actions,
	className,
	headerClassName,
	contentClassName,
	children,
}: WidgetProps) {
	return (
		<div
			className={cn(
				"widget rounded-lg border bg-card text-card-foreground overflow-hidden",
				className,
			)}
		>
			{/* Widget Header */}
			<div
				className={cn(
					"widget-header flex items-center justify-between gap-2 px-4 py-3 border-b",
					headerClassName,
				)}
			>
				<div className="flex items-center gap-2 font-medium">
					{icon && <span className="widget-icon">{icon}</span>}
					<span>{title}</span>
				</div>
				{actions && <div className="widget-actions">{actions}</div>}
			</div>

			{/* Widget Content */}
			<div className={cn("widget-content p-4 overflow-auto", contentClassName)}>
				{children}
			</div>
		</div>
	);
}

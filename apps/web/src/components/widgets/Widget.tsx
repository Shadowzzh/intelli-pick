import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface WidgetProps {
	title: string;
	icon?: ReactNode;
	actions?: ReactNode;
	className?: string;
	children: ReactNode;
}

export function Widget({
	title,
	icon,
	actions,
	className,
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
			<div className="widget-header flex items-center justify-between gap-2 px-4 py-3 border-b">
				<div className="flex items-center gap-2 font-medium">
					{icon && <span className="widget-icon">{icon}</span>}
					<span>{title}</span>
				</div>
				{actions && <div className="widget-actions">{actions}</div>}
			</div>

			{/* Widget Content */}
			<div className="widget-content p-4 overflow-auto">{children}</div>
		</div>
	);
}

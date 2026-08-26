import { Divider } from "@/components/ui/Divider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface WidgetProps {
	title: string;
	icon?: ReactNode;
	actions?: ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	footerClassName?: string;
	children: ReactNode;
	footer?: ReactNode;
}

export function Widget({
	title,
	icon,
	actions,
	className,
	headerClassName,
	contentClassName,
	footerClassName,
	children,
	footer,
}: WidgetProps) {
	return (
		<div
			className={cn(
				"widget min-w-0 rounded-lg border bg-card text-card-foreground overflow-hidden",
				"flex flex-col",
				className,
			)}
		>
			{/* Widget Header */}
			<div
				className={cn(
					"widget-header flex items-center justify-between gap-2 px-4 py-3 border-b",
					"shrink-0",
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
			<div
				className={cn(
					"widget-content p-4 overflow-auto",
					"flex-1",
					contentClassName,
				)}
			>
				{children}
			</div>

			{/* Widget Footer */}
			{footer && (
				<div
					className={cn(
						"widget-footer px-4 py-3 bg-card",
						"shrink-0",
						footerClassName,
					)}
				>
					<Divider className="mb-3" />
					{footer}
				</div>
			)}
		</div>
	);
}

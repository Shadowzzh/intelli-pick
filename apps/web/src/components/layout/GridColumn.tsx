import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GridColumnProps {
	children: ReactNode;
	size?: "small" | "medium" | "large";
	className?: string;
}

export function GridColumn({
	children,
	size = "medium",
	className,
}: GridColumnProps) {
	const sizeClasses = {
		small: "col-span-1 lg:col-span-1",
		medium: "col-span-1 lg:col-span-2",
		large: "col-span-1 lg:col-span-3",
	};

	return (
		<div className={cn(sizeClasses[size], "flex flex-col gap-3", className)}>
			{children}
		</div>
	);
}

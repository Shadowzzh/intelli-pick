import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ColumnProps {
	children: ReactNode;
	size?: "small" | "medium" | "large";
	className?: string;
}

export function Column({ children, size = "medium", className }: ColumnProps) {
	const sizeClasses = {
		small: "lg:w-1/5 w-full",
		medium: "lg:w-2/5 w-full lg:min-w-[400px]",
		large: "lg:w-3/5 w-full lg:min-w-[600px]",
	};

	return (
		<div
			className={cn(
				"min-w-0 flex flex-col gap-5",
				sizeClasses[size],
				className,
			)}
		>
			{children}
		</div>
	);
}

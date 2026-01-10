import { cn } from "@/lib/utils";

export interface DividerProps {
	className?: string;
	orientation?: "horizontal" | "vertical";
}

export function Divider({
	className,
	orientation = "horizontal",
}: DividerProps) {
	if (orientation === "horizontal") {
		return <div className={cn("w-full h-px bg-border", className)} />;
	}

	return <div className={cn("h-full w-px bg-border", className)} />;
}

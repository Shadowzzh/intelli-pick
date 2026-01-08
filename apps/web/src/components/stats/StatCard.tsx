import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
	title: string;
	value: number | string;
	change?: number;
	icon?: React.ReactNode;
	className?: string;
}

export function StatCard({
	title,
	value,
	change,
	icon,
	className,
}: StatCardProps) {
	return (
		<Card className={cn("widget p-4", className)}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm text-muted-foreground">{title}</span>
				{icon}
			</div>

			<div className="text-2xl font-bold">{value}</div>

			{change !== undefined && (
				<div
					className={cn(
						"flex items-center gap-1 text-xs mt-1",
						change >= 0
							? "text-green-600 dark:text-green-400"
							: "text-destructive",
					)}
				>
					{change >= 0 ? (
						<TrendingUp className="h-3 w-3" />
					) : (
						<TrendingDown className="h-3 w-3" />
					)}
					<span>{Math.abs(change)}%</span>
				</div>
			)}
		</Card>
	);
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * 状态驱动配色系统
 */
export const statusStyles = {
	healthy: {
		bg: "bg-green-500/5",
		border: "border-green-500/20",
		text: "text-green-500",
		shadow: "shadow-green-500/10",
	},
	warning: {
		bg: "bg-yellow-500/5",
		border: "border-yellow-500/20",
		text: "text-yellow-500",
		shadow: "shadow-yellow-500/10",
	},
	error: {
		bg: "bg-red-500/5",
		border: "border-red-500/20",
		text: "text-red-500",
		shadow: "shadow-red-500/10",
	},
} as const;

export type StatusType = keyof typeof statusStyles;

/**
 * 将状态类型映射到 Badge variant
 */
export function statusToBadgeVariant(
	status: StatusType,
): "success" | "warning" | "error" {
	if (status === "healthy") return "success";
	return status;
}

/**
 * AI 服务成功率映射
 */
export function getAiStatus(successRate: number): StatusType {
	if (successRate >= 0.95) return "healthy";
	if (successRate >= 0.85) return "warning";
	return "error";
}

export function getAiLabel(successRate: number): string {
	if (successRate >= 0.95) return "优秀";
	if (successRate >= 0.85) return "良好";
	return "需关注";
}

/**
 * 数据源时间状态映射
 */
export function getTimeStatus(lastCollectedAt: Date | string | null): {
	text: string;
	status: StatusType;
	color: string;
} {
	if (!lastCollectedAt) {
		return { text: "未采集", status: "error", color: "text-red-500" };
	}

	const lastTime =
		typeof lastCollectedAt === "string"
			? new Date(lastCollectedAt)
			: lastCollectedAt;
	const hoursDiff = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

	if (hoursDiff < 1) {
		return { text: "刚刚", status: "healthy", color: "text-green-500" };
	}
	if (hoursDiff < 6) {
		return {
			text: `${Math.floor(hoursDiff)}h前`,
			status: "warning",
			color: "text-yellow-500",
		};
	}
	return {
		text: `${Math.floor(hoursDiff)}h前`,
		status: "error",
		color: "text-red-500",
	};
}

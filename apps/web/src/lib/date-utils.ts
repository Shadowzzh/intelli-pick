import {
	addDays,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 日期范围类型
 */
export interface DateRange {
	from?: Date;
	to?: Date;
}

/**
 * 日期范围预设选项
 */
export interface DateRangePreset {
	label: string;
	range: () => DateRange;
}

/**
 * 获取日期范围的开始时间（00:00:00）
 */
export function getStartOfDay(date: Date): Date {
	return startOfDay(date);
}

/**
 * 获取日期范围的结束时间（23:59:59.999）
 */
export function getEndOfDay(date: Date): Date {
	return endOfDay(date);
}

/**
 * 获取"今天"的日期范围
 */
export function getTodayRange(): DateRange {
	const today = new Date();
	return {
		from: getStartOfDay(today),
		to: getEndOfDay(today),
	};
}

/**
 * 获取"昨天"的日期范围
 */
export function getYesterdayRange(): DateRange {
	const yesterday = addDays(new Date(), -1);
	return {
		from: getStartOfDay(yesterday),
		to: getEndOfDay(yesterday),
	};
}

/**
 * 获取"本周"的日期范围（周一到周日）
 */
export function getThisWeekRange(): DateRange {
	const now = new Date();
	return {
		from: startOfWeek(now, { weekStartsOn: 1 }),
		to: endOfWeek(now, { weekStartsOn: 1 }),
	};
}

/**
 * 获取"本月"的日期范围
 */
export function getThisMonthRange(): DateRange {
	const now = new Date();
	return {
		from: startOfMonth(now),
		to: endOfMonth(now),
	};
}

/**
 * 获取"上周"的日期范围
 */
export function getLastWeekRange(): DateRange {
	const now = new Date();
	const lastWeekStart = addDays(startOfWeek(now, { weekStartsOn: 1 }), -7);
	const lastWeekEnd = addDays(endOfWeek(now, { weekStartsOn: 1 }), -7);
	return {
		from: lastWeekStart,
		to: lastWeekEnd,
	};
}

/**
 * 获取"上月"的日期范围
 */
export function getLastMonthRange(): DateRange {
	const now = new Date();
	const lastMonthStart = startOfMonth(addDays(now, -now.getDate()));
	const lastMonthEnd = endOfMonth(addDays(now, -now.getDate()));
	return {
		from: lastMonthStart,
		to: lastMonthEnd,
	};
}

/**
 * 预设的日期范围选项列表
 */
export const DATE_RANGE_PRESETS: DateRangePreset[] = [
	{
		label: "今天",
		range: getTodayRange,
	},
	{
		label: "昨天",
		range: getYesterdayRange,
	},
	{
		label: "本周",
		range: getThisWeekRange,
	},
	{
		label: "本月",
		range: getThisMonthRange,
	},
];

/**
 * 格式化日期显示
 */
export function formatDate(date: Date, formatStr = "yyyy-MM-dd"): string {
	return format(date, formatStr, { locale: zhCN });
}

/**
 * 格式化日期范围显示
 */
export function formatDateRange(
	range: DateRange,
	formatStr = "yyyy-MM-dd",
): string {
	if (!range.from) return "";
	if (!range.to) return formatDate(range.from, formatStr);

	const from = formatDate(range.from, formatStr);
	const to = formatDate(range.to, formatStr);

	return from === to ? from : `${from} 至 ${to}`;
}

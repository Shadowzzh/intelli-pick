/**
 * Cron 表达式转换工具
 */

/**
 * 将秒数转换为 cron 表达式
 * @param seconds - 间隔秒数（最小 60）
 * @param scheduleMinute - 小时间隔任务在每小时的第几分钟执行
 * @returns cron 表达式
 * @throws Error 如果秒数小于 60
 */
export function convertToCron(seconds: number, scheduleMinute = 0): string {
	const minutes = Math.floor(seconds / 60);

	if (minutes < 1) {
		throw new Error(`fetchInterval too small: ${seconds}s (minimum 60s)`);
	}

	// 小于 60 分钟：每 N 分钟执行
	if (minutes < 60) {
		if (scheduleMinute !== 0) {
			throw new Error("scheduleMinute is only supported for hourly intervals");
		}
		return `*/${minutes} * * * *`;
	}

	// 大于等于 60 分钟：每 N 小时执行
	const hours = Math.floor(minutes / 60);
	return `${scheduleMinute} */${hours} * * *`;
}

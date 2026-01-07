/**
 * Cron 表达式转换工具
 */

/**
 * 将秒数转换为 cron 表达式
 * @param seconds - 间隔秒数（最小 60）
 * @returns cron 表达式
 * @throws Error 如果秒数小于 60
 */
export function convertToCron(seconds: number): string {
	const minutes = Math.floor(seconds / 60);

	if (minutes < 1) {
		throw new Error(`fetchInterval too small: ${seconds}s (minimum 60s)`);
	}

	// 小于 60 分钟：每 N 分钟执行
	if (minutes < 60) {
		return `*/${minutes} * * * *`;
	}

	// 大于等于 60 分钟：每 N 小时执行
	const hours = Math.floor(minutes / 60);
	return `0 */${hours} * * *`;
}

/**
 * 时间工具函数
 *
 * 统一处理时区转换，确保所有时间都以 UTC 格式存储。
 */

/**
 * 获取当前 UTC 时间
 * @returns 当前 UTC 时间的 Date 对象
 */
export function getUTCDate(): Date {
	return new Date();
}

/**
 * 将任意时间转换为 UTC ISO 字符串
 * @param date Date 对象或 ISO 字符串
 * @returns UTC ISO 8601 字符串，如 "2026-01-09T09:26:27.165Z"
 *
 * @example
 * toUTCISOString(new Date('2026-01-09T17:26:27+08:00'))
 * // => '2026-01-09T09:26:27.000Z'
 */
export function toUTCISOString(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString();
}

/**
 * 从 ISO 字符串解析为 Date 对象（自动处理时区）
 * @param isoString ISO 8601 字符串
 * @returns Date 对象
 *
 * @example
 * fromISO('2026-01-09T09:26:27.000Z')
 * // => Date(2026-01-09T09:26:27.000Z)
 */
export function fromISO(isoString: string): Date {
	return new Date(isoString);
}

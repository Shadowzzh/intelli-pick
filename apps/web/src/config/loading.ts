/**
 * 延迟 loading 配置
 *
 * 用于避免快速请求时的 loading 闪烁
 * 如果请求在指定延迟时间内完成，则不显示 loading 状态
 */
export const DEFERRED_LOADING_CONFIG = {
	/**
	 * 默认延迟时间（毫秒）
	 *
	 * 只有当 loading 状态持续超过此时间时，才会显示 loading UI
	 *
	 * @default 100
	 */
	delay: 100,
} as const;

/**
 * useDeferredLoading hook 的配置选项
 */
export interface DeferredLoadingOptions {
	/**
	 * 延迟时间（毫秒）
	 *
	 * 如果未指定，使用全局默认配置
	 */
	delay?: number;
}

import {
	DEFERRED_LOADING_CONFIG,
	type DeferredLoadingOptions,
} from "@/config/loading";
import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * 延迟显示 loading 状态,避免快速请求时的闪烁
 *
 * @param query - TanStack Query 查询结果
 * @param options - 配置选项
 * @returns 包含延迟状态的查询结果
 *
 * @example
 * ```tsx
 * const query = useQuery({ ... });
 * const { isLoading, isFetching, data } = useDeferredLoading(query);
 *
 * if (isLoading) {
 *   return <Skeleton />;
 * }
 * ```
 */
export function useDeferredLoading<TData = unknown, TError = Error>(
	query: UseQueryResult<TData, TError>,
	options?: DeferredLoadingOptions,
): UseQueryResult<TData, TError> {
	// 获取延迟时间,优先使用局部配置
	const delay = options?.delay ?? DEFERRED_LOADING_CONFIG.delay;

	// 初始化延迟状态为 false，让 useEffect 控制何时显示 loading
	const [deferredIsLoading, setDeferredIsLoading] = useState(false);
	const [deferredIsFetching, setDeferredIsFetching] = useState(false);

	// 处理 isLoading 状态延迟
	useEffect(() => {
		// 如果延迟为 0,禁用延迟功能
		if (delay <= 0) {
			setDeferredIsLoading(query.isLoading);
			return;
		}

		// 从 false → true: 延迟更新
		if (query.isLoading && !deferredIsLoading) {
			const timer = setTimeout(() => {
				setDeferredIsLoading(true);
			}, delay);

			// 清理定时器
			return () => clearTimeout(timer);
		}

		// 从 true → false: 立即更新
		if (!query.isLoading && deferredIsLoading) {
			setDeferredIsLoading(false);
		}
	}, [query.isLoading, deferredIsLoading, delay]);

	// 处理 isFetching 状态延迟
	useEffect(() => {
		// 如果延迟为 0,禁用延迟功能
		if (delay <= 0) {
			setDeferredIsFetching(query.isFetching);
			return;
		}

		// 从 false → true: 延迟更新
		if (query.isFetching && !deferredIsFetching) {
			const timer = setTimeout(() => {
				setDeferredIsFetching(true);
			}, delay);

			// 清理定时器
			return () => clearTimeout(timer);
		}

		// 从 true → false: 立即更新
		if (!query.isFetching && deferredIsFetching) {
			setDeferredIsFetching(false);
		}
	}, [query.isFetching, deferredIsFetching, delay]);

	// 返回新的查询结果,覆盖延迟状态
	// 使用类型断言来绕过 UseQueryResult 联合类型的严格检查
	return {
		...query,
		isLoading: deferredIsLoading,
		isFetching: deferredIsFetching,
	} as UseQueryResult<TData, TError>;
}

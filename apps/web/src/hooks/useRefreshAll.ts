import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

/**
 * 刷新所有数据的 hook
 * 使用 TanStack Query 的 invalidateQueries() 清除所有缓存并重新获取数据
 */
export function useRefreshAll() {
	const queryClient = useQueryClient();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const refreshAll = useCallback(async () => {
		setIsRefreshing(true);
		try {
			// 清除所有查询缓存，触发所有活跃的查询重新获取
			await queryClient.invalidateQueries();
		} finally {
			// 给予一些时间让请求开始，提升用户体验
			setTimeout(() => {
				setIsRefreshing(false);
			}, 500);
		}
	}, [queryClient]);

	return { isRefreshing, refreshAll };
}

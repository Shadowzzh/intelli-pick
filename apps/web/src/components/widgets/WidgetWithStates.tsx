import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { WidgetErrorState } from "@/components/widgets/WidgetErrorState";
import { WidgetLoadingState } from "@/components/widgets/WidgetLoadingState";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { isValidElement } from "react";

export interface WidgetWithStatesProps<TData> {
	// Widget 基础属性
	title: string;
	icon?: ReactNode;
	actions?: ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;

	// 数据查询
	query: UseQueryResult<TData>;

	// 状态配置（可选）
	loading?: boolean | ReactNode;
	empty?:
		| boolean
		| {
				message?: string;
				icon?: ReactNode;
				iconType?: "default" | "tags" | "entities" | "contents";
		  };
	error?: boolean | { message?: string; showDetails?: boolean };

	// 成功状态渲染
	children: (data: TData) => ReactNode;
}

export function WidgetWithStates<TData>({
	query,
	loading,
	empty,
	error,
	children,
	...widgetProps
}: WidgetWithStatesProps<TData>) {
	// 1. Loading 状态
	if (query.isLoading) {
		if (loading === false) {
			// 允许禁用默认 loading
			return <Widget {...widgetProps}>{children(null as TData)}</Widget>;
		}
		if (isValidElement(loading)) {
			return <Widget {...widgetProps}>{loading}</Widget>;
		}
		// 默认：使用骨架屏
		return (
			<Widget {...widgetProps}>
				<WidgetLoadingState />
			</Widget>
		);
	}

	// 2. Error 状态
	if (query.error) {
		if (error === false) {
			return <Widget {...widgetProps}>{children(null as TData)}</Widget>;
		}
		if (isValidElement(error)) {
			return <Widget {...widgetProps}>{error}</Widget>;
		}
		// 默认：使用错误状态组件
		const errorConfig = typeof error === "object" ? error : {};
		return (
			<Widget {...widgetProps}>
				<WidgetErrorState
					error={query.error as Error}
					onRetry={() => query.refetch()}
					message={errorConfig.message}
					showDetails={errorConfig.showDetails}
				/>
			</Widget>
		);
	}

	// 3. Empty 状态
	const data = query.data;
	const isEmpty = (() => {
		// 处理 null/undefined
		if (!data) return true;

		// 处理数组
		if (Array.isArray(data)) return data.length === 0;

		// 处理 PaginatedResponse 格式: { success: true, data: T[], meta: {...} }
		if (
			typeof data === "object" &&
			"success" in data &&
			"data" in data &&
			"meta" in data
		) {
			const paginatedData = data as { data: unknown };
			return (
				Array.isArray(paginatedData.data) && paginatedData.data.length === 0
			);
		}

		// 处理对象：检查是否包含空数组字段
		// 例如：{ categories: [], total: 0 } 或 { tags: [], total: 0 }
		if (typeof data === "object") {
			const values = Object.values(data);
			// 找出所有数组字段
			const arrayValues = values.filter((v) => Array.isArray(v));

			// 如果存在数组字段，检查是否所有数组都为空
			if (arrayValues.length > 0) {
				return arrayValues.every((arr) => arr.length === 0);
			}

			// 如果没有数组字段，不视为空
			return false;
		}

		return false;
	})();

	if (isEmpty && empty !== false) {
		if (isValidElement(empty)) {
			return <Widget {...widgetProps}>{empty}</Widget>;
		}
		// 默认：使用空状态组件
		const emptyConfig = typeof empty === "object" ? empty : {};
		return (
			<Widget {...widgetProps}>
				<WidgetEmptyState
					message={emptyConfig.message}
					icon={emptyConfig.icon}
					iconType={emptyConfig.iconType}
				/>
			</Widget>
		);
	}

	// 4. 成功状态
	return <Widget {...widgetProps}>{children(data as TData)}</Widget>;
}

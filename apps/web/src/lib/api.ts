import type {
	ApiError,
	ApiResponse,
	GraphqlResponse,
	GraphqlVariables,
	PaginatedResponse,
	PaginationParams,
} from "@intellipick/shared";
import { ApiRequestError } from "@intellipick/shared";
// apps/web/src/lib/api.ts
import axios, {
	type AxiosError,
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";

// ========== 配置 ==========

// 开发环境使用代理，生产环境直接访问 API
// 开发环境：VITE_API_URL=/ 使用相对路径，由 Vite proxy 转发
// 生产环境：VITE_API_URL=http://your-api.com 直接访问后端
const API_URL = import.meta.env.VITE_API_URL || "/";

// ========== 类型定义 ==========
// 注意: GraphQL 相关类型已移至 @intellipick/shared
// 统计数据和 Web 特定类型已移至 @intellipick/shared
// API 错误类已移至 @intellipick/shared

/** 内容查询参数 */
export interface ContentQueryParams extends PaginationParams {
	sources?: string[];
	categories?: string[];
	minScore?: number;
	sortBy?: "date" | "score" | "relevance";
	searchQuery?: string;
}

// ========== Axios 实例 ==========

const axiosInstance: AxiosInstance = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 30000,
});

// ========== 请求拦截器 ==========

axiosInstance.interceptors.request.use(
	(config) => {
		// 可以在这里添加认证 token
		// if (token) {
		//   config.headers.Authorization = `Bearer ${token}`;
		// }

		// 添加请求时间戳（用于调试）
		config.metadata = { startTime: Date.now() };

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// ========== 响应拦截器 ==========

axiosInstance.interceptors.response.use(
	(response: AxiosResponse) => {
		// 计算请求耗时
		const endTime = Date.now();
		const duration = endTime - (response.config.metadata?.startTime || endTime);

		// 开发环境下打印请求日志
		if (import.meta.env.DEV) {
			console.log(
				`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`,
				{
					status: response.status,
					duration: `${duration}ms`,
				},
			);
		}

		return response;
	},
	(error: AxiosError<ApiError>) => {
		// 处理错误响应
		if (error.response) {
			// 服务器返回错误状态码
			const apiError = error.response.data;

			if (apiError && !apiError.success) {
				// 标准化的 API 错误
				return Promise.reject(new ApiRequestError(apiError));
			}

			// 非 API 错误格式
			return Promise.reject({
				message: error.message,
				statusCode: error.response.status,
				details: error.response.data,
			});
		}

		if (error.request) {
			// 请求已发送但没有收到响应
			return Promise.reject({
				message: "网络错误，请检查网络连接",
				code: "NETWORK_ERROR",
			});
		}

		// 请求配置错误
		return Promise.reject({
			message: error.message,
			code: "REQUEST_CONFIG_ERROR",
		});
	},
);

// 扩展 AxiosRequestConfig 以包含 metadata
declare module "axios" {
	interface AxiosRequestConfig {
		metadata?: {
			startTime: number;
		};
	}
}

// ========== API 方法 ==========

export const api = {
	// ========== GraphQL ==========

	/**
	 * 发送 GraphQL 查询
	 * @param query GraphQL 查询字符串
	 * @param variables 查询变量
	 * @returns 查询结果
	 */
	async graphql<T>(query: string, variables?: GraphqlVariables): Promise<T> {
		const response = await axiosInstance.post<GraphqlResponse<T>>(
			"/graphql",
			{
				query,
				variables,
			},
			{
				headers: {
					// GraphQL 请求使用 JSON
				},
			},
		);

		// 检查 GraphQL 错误
		if (response.data.errors) {
			const error = response.data.errors[0];
			throw new Error(error.message || "GraphQL 查询失败");
		}

		if (!response.data.data) {
			throw new Error("GraphQL 查询返回空数据");
		}

		return response.data.data;
	},

	// ========== REST API ==========

	/**
	 * GET 请求
	 * @param path 请求路径
	 * @param config Axios 配置
	 * @returns 响应数据
	 */
	async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await axiosInstance.get<ApiResponse<T>>(path, config);
		return response.data.data;
	},

	/**
	 * POST 请求
	 * @param path 请求路径
	 * @param data 请求体
	 * @param config Axios 配置
	 * @returns 响应数据
	 */
	async post<T>(
		path: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await axiosInstance.post<ApiResponse<T>>(
			path,
			data,
			config,
		);
		return response.data.data;
	},

	/**
	 * PUT 请求
	 * @param path 请求路径
	 * @param data 请求体
	 * @param config Axios 配置
	 * @returns 响应数据
	 */
	async put<T>(
		path: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await axiosInstance.put<ApiResponse<T>>(
			path,
			data,
			config,
		);
		return response.data.data;
	},

	/**
	 * DELETE 请求
	 * @param path 请求路径
	 * @param config Axios 配置
	 * @returns 响应数据
	 */
	async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await axiosInstance.delete<ApiResponse<T>>(path, config);
		return response.data.data;
	},

	// ========== 分页请求 ==========

	/**
	 * 获取分页数据
	 * @param path 请求路径
	 * @param params 查询参数
	 * @returns 分页响应
	 */
	async getPaginated<T>(
		path: string,
		params?: PaginationParams & Record<string, unknown>,
	): Promise<PaginatedResponse<T>> {
		const response = await axiosInstance.get<PaginatedResponse<T>>(path, {
			params,
		});
		return response.data;
	},
};

// ========== React Query keys ==========

export const queryKeys = {
	// 全部内容
	contents: ["contents"] as const,

	// 按来源筛选内容
	contentsBySource: (source: string) => ["contents", "source", source] as const,

	// 按实体筛选内容
	contentsByEntity: (entity: string) => ["contents", "entity", entity] as const,

	// 实体列表
	entities: ["entities"] as const,

	// 统计数据
	stats: ["stats"] as const,

	// 搜索
	search: (query: string) => ["search", query] as const,
} as const;

// ========== 导出类型 ==========

// 从 @intellipick/shared 导出的类型已在文件开头导入

import { env } from "@intellipick/env";
// apps/api/src/lib/logger.ts
import pino from "pino";

// 判断环境类型
const isDevelopment = env.NODE_ENV === "development";
const isProduction = env.NODE_ENV === "production";

// 基础配置
const baseConfig: pino.LoggerOptions = {
	level: env.LOG_LEVEL,
	base: {
		env: env.NODE_ENV,
	},
};

// 开发环境配置：使用 pino-pretty 美化输出
if (isDevelopment && env.LOG_PRETTY) {
	baseConfig.transport = {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "SYS:standard",
			ignore: "pid,hostname",
			singleLine: false,
		},
	};
}

// 生产环境配置：优化性能
if (isProduction) {
	baseConfig.formatters = {
		level: (label) => ({ level: label }),
	};
	baseConfig.timestamp = pino.stdTimeFunctions.isoTime;
}

// 创建根 logger
export const logger = pino(baseConfig);

/**
 * 创建带名称的子 logger
 * @param name 模块名称
 * @param meta 额外的元数据
 */
export function createLogger(name: string, meta?: Record<string, unknown>) {
	return logger.child({
		name,
		...meta,
	});
}

/**
 * 创建带追踪 ID 的 logger
 * @param name 模块名称
 * @param requestId 追踪 ID（可以是 BullMQ job ID、HTTP 请求 ID 等）
 */
export function createRequestLogger(name: string, requestId: string) {
	return createLogger(name, { requestId });
}

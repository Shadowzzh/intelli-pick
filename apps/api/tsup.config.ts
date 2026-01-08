import { defineConfig } from "tsup";

export default defineConfig({
	// 多入口点：主应用 + 导出的子模块
	entry: {
		index: "src/index.ts",
		"lib/ai": "src/lib/ai.ts",
		pipeline: "src/pipeline.ts",
		"pipeline/ai-extract": "src/pipeline/ai-extract.ts",
		"pipeline/ai-filter": "src/pipeline/ai-filter.ts",
		"pipeline/dedup": "src/pipeline/dedup.ts",
		"pipeline/hard-filter": "src/pipeline/hard-filter.ts",
		"pipeline/storage": "src/pipeline/storage.ts",
		"pipeline/types": "src/pipeline/types.ts",
	},

	// 输出格式：ES Module
	format: ["esm"],

	// 生成类型定义文件
	dts: true,

	// 生成 source map
	sourcemap: true,

	// 清理 dist 目录
	clean: true,

	// 不打包外部依赖（保持外部引用，减小 bundle 体积）
	// 注意：workspace 包会被打包进去，因为它们是相对路径
	external: [
		// 所有外部依赖都保持外部引用
		// 这样可以减小 bundle 体积，并且依赖会通过 node_modules 解析
		/^(@ai-sdk|ai|bullmq|cheerio|cron|dayjs|drizzle-orm|https-proxy-agent|ioredis|pino|rss-parser|twitter-api-v2|undici|zod|@t3-oss|dotenv)/,
	],

	// 生产环境优化
	minify: false,
	minifyWhitespace: false,

	// 目标环境
	target: "es2022",

	// 分割代码（如果需要）
	splitting: false,
	treeshake: true,
});

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAiClient } from "@intellipick/api/lib/ai";
import { loadConfig } from "@intellipick/config";
import type { AiConfig } from "@intellipick/config";
import type { RawContent } from "@intellipick/shared";
import type { CoreMessage } from "ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PROJECT_ROOT = join(__dirname, "../../../");
export const TEST_DATA_DIR = join(PROJECT_ROOT, "test-data");
export const DEFAULT_TEST_DATA_FILE = join(
	TEST_DATA_DIR,
	"twitter-samples.json",
);

/**
 * 辅助函数：安全地获取错误信息
 */
export function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
}

/**
 * 获取 AI 错误的详细信息
 */
export function getAiErrorInfo(err: unknown): {
	type?: string;
	name?: string;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
} {
	// AI SDK 可能返回额外的属性
	const errorObj = err as Record<string, unknown>;
	return {
		type: errorObj.type as string | undefined,
		name: errorObj.name as string | undefined,
		usage: errorObj.usage as
			| {
					promptTokens?: number;
					completionTokens?: number;
					totalTokens?: number;
			  }
			| undefined,
	};
}

/**
 * 测试样本数据结构
 */
export interface TestSample {
	metadata: {
		collectedAt: string;
		sourceConfig: unknown;
		count: number;
	};
	samples: RawContent[];
}

/**
 * 查找最新的测试数据文件
 */
export function findLatestTestDataFile(): string | null {
	try {
		const files = readdirSync(TEST_DATA_DIR);
		const twitterFiles = files
			.filter((f) => f.startsWith("twitter-samples-") && f.endsWith(".json"))
			.map((f) => ({
				name: f,
				path: join(TEST_DATA_DIR, f),
				mtime: statSync(join(TEST_DATA_DIR, f)).mtime.getTime(),
			}))
			.sort((a, b) => b.mtime - a.mtime);

		return twitterFiles.length > 0 ? twitterFiles[0].path : null;
	} catch {
		return null;
	}
}

/**
 * 加载测试数据
 * @param filePath - 可选的测试数据文件路径。如果未指定，会尝试查找最新的文件
 */
export async function loadTestData(filePath?: string): Promise<TestSample> {
	let testDataFile = filePath;

	// 如果未指定文件，尝试查找最新的
	if (!testDataFile) {
		// 先尝试默认文件
		try {
			if (statSync(DEFAULT_TEST_DATA_FILE).isFile()) {
				testDataFile = DEFAULT_TEST_DATA_FILE;
			}
		} catch {
			// 默认文件不存在，查找最新的时间戳文件
			const latestFile = findLatestTestDataFile();
			if (latestFile) {
				testDataFile = latestFile;
			} else {
				throw new Error(
					"未找到测试数据文件\n请先运行: pnpm --filter @intellipick/test-scripts run collect",
				);
			}
		}
	}

	// 确保文件路径已确定
	if (!testDataFile) {
		throw new Error(
			"未找到测试数据文件\n请先运行: pnpm --filter @intellipick/test-scripts run collect",
		);
	}

	try {
		const text = readFileSync(testDataFile, "utf-8");
		const testData = JSON.parse(text) as TestSample;
		return testData;
	} catch (err) {
		throw new Error(
			`无法加载测试数据文件: ${testDataFile}\n${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

/**
 * 加载配置
 */
export async function loadTestConfig(): Promise<AiConfig> {
	const originalCwd = process.cwd();
	process.chdir(PROJECT_ROOT);
	const config = await loadConfig();
	process.chdir(originalCwd);
	return config.ai;
}

/**
 * 初始化 AI 客户端
 */
export function initAiClient(config: AiConfig) {
	return createAiClient(config);
}

/**
 * 保存测试结果
 */
export function saveTestResults(results: unknown): string {
	const resultsFile = join(
		PROJECT_ROOT,
		`test-data/test-results-${Date.now()}.json`,
	);
	writeFileSync(resultsFile, JSON.stringify(results, null, 2), "utf-8");
	return resultsFile;
}

/**
 * 打印 AI 错误详情
 */
export function printAiErrorDetails(err: unknown): void {
	const aiErrorInfo = getAiErrorInfo(err);
	console.error(`      错误类型: ${aiErrorInfo.type || "Unknown"}`);
	console.error(`      错误名称: ${aiErrorInfo.name || "Unknown"}`);
	if (aiErrorInfo.usage) {
		console.error("      Token 使用:");
		console.error(`        - Prompt: ${aiErrorInfo.usage.promptTokens}`);
		console.error(
			`        - Completion: ${aiErrorInfo.usage.completionTokens}`,
		);
		console.error(`        - Total: ${aiErrorInfo.usage.totalTokens}`);
	}
}

/**
 * 打印测试样本信息
 */
export function printSampleInfo(
	index: number,
	total: number,
	item: RawContent,
): void {
	console.log(`\n📝 测试样本 ${index + 1}/${total}`);
	console.log("─".repeat(80));
	console.log(`URL: ${item.url}`);
	console.log(
		`内容: ${item.content.substring(0, 150)}${item.content.length > 150 ? "..." : ""}`,
	);
	console.log("─".repeat(80));
}

/**
 * 打印分隔线
 */
export function printSeparator(char = "─", length = 80): void {
	console.log(`${char.repeat(length)}`);
}

/**
 * 打印标题分隔线
 */
export function printTitleSeparator(): void {
	console.log(`${"=".repeat(80)}`);
}

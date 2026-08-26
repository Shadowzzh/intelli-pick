import type { ExtractResult, RawContent } from "@intellipick/shared";
import {
	AiExtractStep,
	type PipelineContext,
} from "@intellipick/worker/pipeline";
import { StepStatus } from "@intellipick/worker/pipeline/types";
import {
	getErrorMessage,
	initAiClient,
	loadTestConfig,
	loadTestData,
	printAiErrorDetails,
	printSampleInfo,
	printSeparator,
	printTitleSeparator,
	saveTestResults,
} from "./test-utils";

interface TestResult {
	index: number;
	item: RawContent;
	success: boolean;
	duration: number;
	error?: string;
	result?: ExtractResult;
}

/**
 * AI Extract 独立测试脚本
 * 测试 AI 实体提取和分类功能
 *
 * 使用方法:
 *   pnpm --filter @intellipick/test-scripts run test:extract [文件路径]
 *
 * 示例:
 *   pnpm --filter @intellipick/test-scripts run test:extract                    # 使用最新的测试数据
 *   pnpm --filter @intellipick/test-scripts run test:extract test-data/xxx.json # 指定文件
 */
async function main() {
	console.log("🧪 AI Extract 独立测试脚本\n");

	// 获取命令行参数
	const testDataFile = process.argv[2];

	// 1. 加载测试数据
	console.log("📂 加载测试数据...");
	const testData = await loadTestData(testDataFile);
	console.log(`   ✅ 加载了 ${testData.samples.length} 条测试样本`);

	// 2. 加载配置
	console.log("\n📋 加载配置...");
	const config = await loadTestConfig();
	console.log("   ✅ 配置加载完成");

	// 3. 初始化 AI 客户端
	console.log("\n🤖 初始化 AI 客户端...");
	const ai = initAiClient(config);
	console.log("   ✅ AI 客户端已初始化");

	// 4. 创建 AI Extract 步骤
	console.log("\n🔧 创建 AI Extract 步骤...");
	const aiExtractStep = new AiExtractStep(ai);
	console.log("   ✅ AI Extract 步骤已创建");

	// 5. 执行测试
	printTitleSeparator();
	console.log("🚀 开始测试");
	printTitleSeparator();
	console.log();

	const results: TestResult[] = [];
	for (let i = 0; i < testData.samples.length; i++) {
		const item = testData.samples[i];
		printSampleInfo(i, testData.samples.length, item);

		const start = Date.now();
		try {
			const ctx: PipelineContext = { raw: item, aiMetrics: {} };
			const stepResult = await aiExtractStep.process(ctx);
			const duration = Date.now() - start;

			// 情况 1: 错误
			if (stepResult.status === StepStatus.Error) {
				results.push({
					index: i,
					item,
					success: false,
					duration,
					error: stepResult.error?.message || "Unknown error",
				});
				console.log(
					`   ❌ 失败 (${duration}ms): ${stepResult.error?.message || "Unknown error"}`,
				);
			}
			// 情况 2: 成功（Continue 或 Filtered）
			else if (stepResult.context?.extractResult) {
				const extractResult = stepResult.context.extractResult;
				results.push({
					index: i,
					item,
					success: true,
					duration,
					result: extractResult,
				});

				console.log(`   ✅ 完成 (${duration}ms)`);
				console.log("\n   📦 AI Extract 结果:");
				console.log(`      标题: ${extractResult.title}`);
				console.log(`      摘要: ${extractResult.summary}`);
				console.log(`      分类: ${extractResult.category}`);
				console.log(`      标签: [${extractResult.tags.join(", ")}]`);
				console.log(`      核心观点: [${extractResult.keyPoints.join("; ")}]`);
				console.log(`      数据点: [${extractResult.dataPoints.join("; ")}]`);
				console.log(`      实体 (${extractResult.entities.length}):`);
				for (const [idx, entity] of extractResult.entities.entries()) {
					console.log(
						`        ${idx + 1}. ${entity.name} [${entity.type}]${entity.url ? ` - ${entity.url}` : ""}${entity.description ? ` - ${entity.description}` : ""}`,
					);
				}
			} else {
				results.push({
					index: i,
					item,
					success: false,
					duration,
					error: "返回结果为空",
				});
				console.log(`   ❌ 失败 (${duration}ms): 返回结果为空`);
			}
		} catch (err) {
			const duration = Date.now() - start;
			results.push({
				index: i,
				item,
				success: false,
				duration,
				error: getErrorMessage(err),
			});
			console.error(`   ❌ 失败 (${duration}ms): ${getErrorMessage(err)}`);
			printAiErrorDetails(err);
		}

		printSeparator();
	}

	// 6. 输出测试汇总
	printTitleSeparator();
	console.log("📊 测试汇总");
	printTitleSeparator();

	const total = results.length;
	const successCount = results.filter((r) => r.success).length;
	const failCount = total - successCount;

	console.log(`\n总样本数: ${total}`);
	console.log(
		`成功: ${successCount} (${((successCount / total) * 100).toFixed(1)}%)`,
	);
	console.log(
		`失败: ${failCount} (${((failCount / total) * 100).toFixed(1)}%)`,
	);

	// 失败详情
	if (failCount > 0) {
		console.log("\n❌ 失败详情:");
		for (const r of results.filter((r) => !r.success)) {
			console.log(`  - ${r.index + 1}. ${r.error || "Unknown error"}`);
		}
	}

	// 性能统计
	const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / total;
	const minTime = Math.min(...results.map((r) => r.duration));
	const maxTime = Math.max(...results.map((r) => r.duration));

	console.log("\n⏱️  性能统计:");
	console.log(`  平均耗时: ${avgTime.toFixed(0)}ms`);
	console.log(`  最快: ${minTime}ms`);
	console.log(`  最慢: ${maxTime}ms`);

	// 提取统计
	if (successCount > 0) {
		const successResults = results.filter(
			(r): r is TestResult & { result: ExtractResult } =>
				r.success && r.result !== undefined,
		);

		// 分类统计
		const categories = new Map<string, number>();
		for (const r of successResults) {
			const cat = r.result.category;
			categories.set(cat, (categories.get(cat) || 0) + 1);
		}

		// 标签统计
		const tagCounts = new Map<string, number>();
		for (const r of successResults) {
			for (const tag of r.result.tags) {
				tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
			}
		}

		// 实体统计
		const entityCounts = new Map<string, number>();
		const entityTypeCounts = new Map<string, number>();
		let totalEntities = 0;

		for (const r of successResults) {
			totalEntities += r.result.entities.length;
			for (const entity of r.result.entities) {
				entityCounts.set(entity.name, (entityCounts.get(entity.name) || 0) + 1);
				entityTypeCounts.set(
					entity.type,
					(entityTypeCounts.get(entity.type) || 0) + 1,
				);
			}
		}

		// 平均实体数
		const avgEntities = totalEntities / successResults.length;

		console.log("\n📈 提取统计:");
		console.log(`  平均实体数: ${avgEntities.toFixed(1)}`);
		console.log(`  总实体数: ${totalEntities}`);
		console.log(`  唯一实体数: ${entityCounts.size}`);

		// 分类分布
		console.log("\n📂 分类分布:");
		for (const [cat, count] of Array.from(categories.entries()).sort(
			(a, b) => b[1] - a[1],
		)) {
			console.log(
				`  ${cat}: ${count} (${((count / successResults.length) * 100).toFixed(1)}%)`,
			);
		}

		// 高频标签
		console.log("\n🏷️  高频标签 (Top 10):");
		for (const [tag, count] of Array.from(tagCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)) {
			console.log(`  ${tag}: ${count}`);
		}

		// 实体类型分布
		console.log("\n🏢 实体类型分布:");
		for (const [type, count] of Array.from(entityTypeCounts.entries()).sort(
			(a, b) => b[1] - a[1],
		)) {
			console.log(`  ${type}: ${count}`);
		}

		// 高频实体
		console.log("\n👤 高频实体 (Top 10):");
		for (const [entity, count] of Array.from(entityCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)) {
			console.log(`  ${entity}: ${count}`);
		}
	}

	printTitleSeparator();
	console.log("✅ 测试完成!");
	printTitleSeparator();
	console.log();

	// 7. 保存测试结果
	const resultsFile = saveTestResults(results);
	console.log(`💾 保存测试结果到: ${resultsFile}`);
	console.log("   ✅ 保存成功\n");
}

main().catch((err) => {
	console.error("\n❌ 脚本执行失败:", err);
	process.exit(1);
});

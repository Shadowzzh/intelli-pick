import { AiFilterStep, type PipelineContext } from "@intellipick/api/pipeline";
import type { FilterResult, RawContent } from "@intellipick/shared";
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
	result?: FilterResult;
}

/**
 * AI Filter 独立测试脚本
 * 测试 AI 质量评分和安全检查功能
 *
 * 使用方法:
 *   pnpm --filter @intellipick/test-scripts run test:filter [文件路径]
 *
 * 示例:
 *   pnpm --filter @intellipick/test-scripts run test:filter                    # 使用最新的测试数据
 *   pnpm --filter @intellipick/test-scripts run test:filter test-data/xxx.json # 指定文件
 */
async function main() {
	console.log("🧪 AI Filter 独立测试脚本\n");

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

	// 4. 创建 AI Filter 步骤
	console.log("\n🔧 创建 AI Filter 步骤...");
	const aiFilterStep = new AiFilterStep(ai, {
		hardRules: { enabled: false, blacklistDomains: [], spamKeywords: [] },
		thresholds: {
			passMinValueScore: 30,
			rejectMaxValueScore: 15,
			quarantineOnSafety: true,
		},
		promptVersion: "v1.0",
		quarantineTTLDays: 30,
	});
	console.log("   ✅ AI Filter 步骤已创建");

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
			const ctx: PipelineContext = { raw: item };
			const result = await aiFilterStep.process(ctx);
			const duration = Date.now() - start;
			const filterResult = result?.filterResult;

			if (result && filterResult) {
				results.push({
					index: i,
					item,
					success: true,
					duration,
					result: filterResult,
				});

				console.log(`   ✅ 完成 (${duration}ms)`);
				console.log("\n   📊 AI Filter 结果:");
				console.log(`      决策: ${filterResult.decision}`);
				console.log(`      价值评分: ${filterResult.valueScore}/100`);
				console.log(`      噪声评分: ${filterResult.noiseScore}/100`);
				console.log("      安全评估:");
				console.log(`        - NSFW: ${filterResult.safety.nsfwSexual}/3`);
				console.log(`        - 骚扰: ${filterResult.safety.harassment}/3`);
				console.log(`        - 诈骗: ${filterResult.safety.scam}/3`);
				console.log(`      原因: [${filterResult.reasons.join(", ")}]`);
				console.log(`      信号: [${filterResult.signals.join(", ")}]`);
				console.log(`      说明: ${filterResult.oneLineWhy}`);
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

	// 决策统计
	const passCount = results.filter((r) => r.result?.decision === "pass").length;
	const rejectCount = results.filter(
		(r) => r.result?.decision === "reject",
	).length;
	console.log("\n🎯 决策分布:");
	console.log(
		`  Pass: ${passCount}/${total} (${((passCount / total) * 100).toFixed(1)}%)`,
	);
	console.log(
		`  Reject: ${rejectCount}/${total} (${((rejectCount / total) * 100).toFixed(1)}%)`,
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

	// 评分统计
	if (successCount > 0) {
		const successResults = results.filter(
			(r): r is TestResult & { result: FilterResult } =>
				r.success && r.result !== undefined,
		);
		const avgValueScore =
			successResults.reduce((sum, r) => sum + r.result.valueScore, 0) /
			successResults.length;
		const avgNoiseScore =
			successResults.reduce((sum, r) => sum + r.result.noiseScore, 0) /
			successResults.length;

		console.log("\n📈 评分统计:");
		console.log(`  平均价值评分: ${avgValueScore.toFixed(1)}/100`);
		console.log(`  平均噪声评分: ${avgNoiseScore.toFixed(1)}/100`);
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

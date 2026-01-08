import type { FilterResult, RawContent } from "@intellipick/shared";
import {
	AiFilterStep,
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
	result?: FilterResult;
	filtered?: boolean; // 标记是否被过滤（reject）
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
			rejectToQuarantineMinScore: 30,
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
			const stepResult = await aiFilterStep.process(ctx);
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
			// 情况 2: 被过滤 - 但现在有原因信息
			else if (stepResult.status === StepStatus.Filtered) {
				const filterResult = stepResult.context?.filterResult;
				results.push({
					index: i,
					item,
					success: true,
					duration,
					result: filterResult,
					filtered: true,
				});
				console.log(`   🔒 过滤 (${duration}ms)`);
				if (filterResult) {
					console.log(`      说明: ${filterResult.oneLineWhy}`);
					console.log(`      评分: ${filterResult.valueScore}/100`);
				}
			}
			// 情况 3: 继续执行 - 正常通过
			else if (stepResult.status === StepStatus.Continue) {
				const filterResult = stepResult.context?.filterResult;
				if (filterResult) {
					results.push({
						index: i,
						item,
						success: true,
						duration,
						result: filterResult,
						filtered: false,
					});

					if (filterResult.decision === "pass") {
						console.log(`   ✅ 通过 (${duration}ms)`);
					} else if (filterResult.decision === "quarantine") {
						console.log(`   ⚠️  隔离 (${duration}ms)`);
					}

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
						success: true,
						duration,
						filtered: false,
					});
					console.log(`   ✅ 通过 (${duration}ms): 无 filterResult`);
				}
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
	const passCount = results.filter((r) => r.result?.decision === "pass").length;
	const rejectCount = results.filter(
		(r) => r.result?.decision === "reject" || r.filtered,
	).length;
	const quarantineCount = results.filter(
		(r) => r.result?.decision === "quarantine",
	).length;
	const failCount = results.filter((r) => !r.success).length;

	console.log(`\n总样本数: ${total}`);
	console.log("\n📋 处理结果:");
	console.log(
		`  ✅ 通过: ${passCount}/${total} (${((passCount / total) * 100).toFixed(1)}%)`,
	);
	console.log(
		`  🔒 过滤: ${rejectCount}/${total} (${((rejectCount / total) * 100).toFixed(1)}%)`,
	);
	if (quarantineCount > 0) {
		console.log(
			`  ⚠️  隔离: ${quarantineCount}/${total} (${((quarantineCount / total) * 100).toFixed(1)}%)`,
		);
	}
	console.log(
		`  ❌ 失败: ${failCount}/${total} (${((failCount / total) * 100).toFixed(1)}%)`,
	);

	// 失败详情
	if (failCount > 0) {
		console.log("\n❌ 失败详情:");
		for (const r of results.filter((r) => !r.success)) {
			console.log(`  - 样本 ${r.index + 1}: ${r.error || "Unknown error"}`);
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

	// 评分统计 - 只统计有结果的项目（包括过滤的）
	const resultsWithData = results.filter(
		(r): r is TestResult & { result: FilterResult } => r.result !== undefined,
	);

	if (resultsWithData.length > 0) {
		const avgValueScore =
			resultsWithData.reduce((sum, r) => sum + r.result.valueScore, 0) /
			resultsWithData.length;
		const avgNoiseScore =
			resultsWithData.reduce((sum, r) => sum + r.result.noiseScore, 0) /
			resultsWithData.length;

		console.log("\n📈 评分统计:");
		console.log(`  平均价值评分: ${avgValueScore.toFixed(1)}/100`);
		console.log(`  平均噪声评分: ${avgNoiseScore.toFixed(1)}/100`);

		// 按决策分组统计
		const passResults = resultsWithData.filter(
			(r) => r.result.decision === "pass",
		);
		const rejectResults = resultsWithData.filter(
			(r) => r.result.decision === "reject",
		);

		if (passResults.length > 0) {
			const avgPassValue =
				passResults.reduce((sum, r) => sum + r.result.valueScore, 0) /
				passResults.length;
			const avgPassNoise =
				passResults.reduce((sum, r) => sum + r.result.noiseScore, 0) /
				passResults.length;
			console.log("\n  通过样本的评分:");
			console.log(`    平均价值评分: ${avgPassValue.toFixed(1)}/100`);
			console.log(`    平均噪声评分: ${avgPassNoise.toFixed(1)}/100`);
		}

		if (rejectResults.length > 0) {
			const avgRejectValue =
				rejectResults.reduce((sum, r) => sum + r.result.valueScore, 0) /
				rejectResults.length;
			const avgRejectNoise =
				rejectResults.reduce((sum, r) => sum + r.result.noiseScore, 0) /
				rejectResults.length;
			console.log("\n  过滤样本的评分:");
			console.log(`    平均价值评分: ${avgRejectValue.toFixed(1)}/100`);
			console.log(`    平均噪声评分: ${avgRejectNoise.toFixed(1)}/100`);
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

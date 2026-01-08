import { AiFilterStep, type PipelineContext } from "@intellipick/worker/pipeline";
import { StepStatus } from "@intellipick/worker/pipeline/types";
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
} from "./test-utils";

interface VerboseTestResult {
	index: number;
	item: RawContent;
	decision: "pass" | "reject" | "quarantine" | "error";
	duration: number;
	error?: string;
	result?: FilterResult;
}

/**
 * AI Filter 详细测试脚本
 * 专注于测试 AI 决策质量，显示所有样本的决策结果（包括被过滤的）
 *
 * 使用方法:
 *   pnpm --filter @intellipick/test-scripts run test:filter-verbose [文件路径]
 *
 * 示例:
 *   pnpm --filter @intellipick/test-scripts run test:filter-verbose
 *   pnpm --filter @intellipick/test-scripts run test:filter-verbose test-data/xxx.json
 */
async function main() {
	console.log("🧪 AI Filter 详细测试脚本\n");
	console.log("📝 本脚本专注于测试 AI 决策质量，会显示所有样本的决策结果\n");

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

	const results: VerboseTestResult[] = [];
	for (let i = 0; i < testData.samples.length; i++) {
		const item = testData.samples[i];
		printSampleInfo(i, testData.samples.length, item);

		const start = Date.now();
		try {
			const ctx: PipelineContext = { raw: item };
			const stepResult = await aiFilterStep.process(ctx);
			const duration = Date.now() - start;

			// 错误情况
			if (stepResult.status === StepStatus.Error) {
				results.push({
					index: i,
					item,
					decision: "error",
					duration,
					error: stepResult.error?.message || "Unknown error",
				});
				console.log(
					`   ❌ ERROR (${duration}ms): ${stepResult.error?.message || "Unknown error"}`,
				);
			}
			// 被过滤
			else if (stepResult.status === StepStatus.Filtered) {
				const filterResult = stepResult.context?.filterResult;
				results.push({
					index: i,
					item,
					decision: filterResult?.decision || "reject",
					duration,
					result: filterResult,
				});
				console.log(
					`   🔒 REJECT (${duration}ms): ${filterResult?.oneLineWhy || "内容被 AI 拒绝"}`,
				);
				if (filterResult) {
					console.log(
						`      价值: ${filterResult.valueScore}/100 | 噪声: ${filterResult.noiseScore}/100`,
					);
				}
			}
			// 有 filterResult - 记录决策
			else if (stepResult.context?.filterResult) {
				const filterResult = stepResult.context.filterResult;
				results.push({
					index: i,
					item,
					decision: filterResult.decision,
					duration,
					result: filterResult,
				});

				// 根据决策显示不同的图标
				const icon =
					filterResult.decision === "pass"
						? "✅"
						: filterResult.decision === "quarantine"
							? "⚠️"
							: "🔒";

				console.log(
					`   ${icon} ${filterResult.decision.toUpperCase()} (${duration}ms)`,
				);
				console.log(
					`      价值: ${filterResult.valueScore}/100 | 噪声: ${filterResult.noiseScore}/100`,
				);
				console.log(`      说明: ${filterResult.oneLineWhy}`);
			}
			// 异常情况
			else {
				results.push({
					index: i,
					item,
					decision: "error",
					duration,
					error: "返回结果异常",
				});
				console.log(`   ❌ ERROR (${duration}ms): 返回结果异常`);
			}
		} catch (err) {
			const duration = Date.now() - start;
			results.push({
				index: i,
				item,
				decision: "error",
				duration,
				error: getErrorMessage(err),
			});
			console.error(`   ❌ ERROR (${duration}ms): ${getErrorMessage(err)}`);
			printAiErrorDetails(err);
		}

		printSeparator();
	}

	// 6. 输出详细汇总
	printTitleSeparator();
	console.log("📊 决策质量汇总");
	printTitleSeparator();

	const total = results.length;
	const passCount = results.filter((r) => r.decision === "pass").length;
	const rejectCount = results.filter((r) => r.decision === "reject").length;
	const quarantineCount = results.filter(
		(r) => r.decision === "quarantine",
	).length;
	const errorCount = results.filter((r) => r.decision === "error").length;

	console.log(`\n总样本数: ${total}`);
	console.log("\n🎯 决策分布:");
	console.log(
		`  ✅ PASS  : ${passCount} (${((passCount / total) * 100).toFixed(1)}%)`,
	);
	console.log(
		`  🔒 REJECT: ${rejectCount} (${((rejectCount / total) * 100).toFixed(1)}%)`,
	);
	if (quarantineCount > 0) {
		console.log(
			`  ⚠️  QUARANTINE: ${quarantineCount} (${((quarantineCount / total) * 100).toFixed(1)}%)`,
		);
	}
	if (errorCount > 0) {
		console.log(
			`  ❌ ERROR : ${errorCount} (${((errorCount / total) * 100).toFixed(1)}%)`,
		);
	}

	// 按 PASS/REJECT 分组显示
	console.log(`\n${"=".repeat(80)}`);
	console.log("✅ PASS 样本详情");
	console.log("=".repeat(80));

	const passResults = results.filter((r) => r.decision === "pass");
	if (passResults.length > 0) {
		for (const r of passResults) {
			console.log(`\n样本 ${r.index + 1}:`);
			console.log(`  URL: ${r.item.url}`);
			if (r.result) {
				console.log(`  价值评分: ${r.result.valueScore}/100`);
				console.log(`  噪声评分: ${r.result.noiseScore}/100`);
				console.log(`  原因: [${r.result.reasons.join(", ")}]`);
				console.log(`  说明: ${r.result.oneLineWhy}`);
			}
		}

		// PASS 样本的平均评分
		const avgPassValue =
			passResults.reduce((sum, r) => sum + (r.result?.valueScore || 0), 0) /
			passResults.length;
		const avgPassNoise =
			passResults.reduce((sum, r) => sum + (r.result?.noiseScore || 0), 0) /
			passResults.length;
		console.log("\n📈 PASS 样本平均评分:");
		console.log(`  价值: ${avgPassValue.toFixed(1)}/100`);
		console.log(`  噪声: ${avgPassNoise.toFixed(1)}/100`);
	} else {
		console.log("\n(无)");
	}

	console.log(`\n${"=".repeat(80)}`);
	console.log("🔒 REJECT 样本详情");
	console.log("=".repeat(80));

	const rejectResults = results.filter((r) => r.decision === "reject");
	if (rejectResults.length > 0) {
		for (const r of rejectResults) {
			console.log(`\n样本 ${r.index + 1}:`);
			console.log(`  URL: ${r.item.url}`);
			console.log(
				`  内容: ${r.item.content.slice(0, 100)}${r.item.content.length > 100 ? "..." : ""}`,
			);
			if (r.result) {
				console.log(`  价值评分: ${r.result.valueScore}/100`);
				console.log(`  噪声评分: ${r.result.noiseScore}/100`);
				console.log(`  原因: [${r.result.reasons.join(", ")}]`);
				console.log(`  说明: ${r.result.oneLineWhy}`);
			} else {
				console.log("  (AI 返回 null，无详细信息)");
			}
		}

		// REJECT 样本的平均评分（仅统计有结果的）
		const rejectResultsWithData = rejectResults.filter(
			(r) => r.result !== undefined,
		);
		if (rejectResultsWithData.length > 0) {
			const avgRejectValue =
				rejectResultsWithData.reduce(
					(sum, r) => sum + (r.result?.valueScore || 0),
					0,
				) / rejectResultsWithData.length;
			const avgRejectNoise =
				rejectResultsWithData.reduce(
					(sum, r) => sum + (r.result?.noiseScore || 0),
					0,
				) / rejectResultsWithData.length;
			console.log(
				`\n📈 REJECT 样本平均评分 (${rejectResultsWithData.length} 个有评分):`,
			);
			console.log(`  价值: ${avgRejectValue.toFixed(1)}/100`);
			console.log(`  噪声: ${avgRejectNoise.toFixed(1)}/100`);
		}
	} else {
		console.log("\n(无)");
	}

	if (quarantineCount > 0) {
		console.log(`\n${"=".repeat(80)}`);
		console.log("⚠️  QUARANTINE 样本详情");
		console.log("=".repeat(80));

		const quarantineResults = results.filter(
			(r) => r.decision === "quarantine",
		);
		for (const r of quarantineResults) {
			console.log(`\n样本 ${r.index + 1}:`);
			console.log(`  URL: ${r.item.url}`);
			if (r.result) {
				console.log(
					`  安全评估: NSFW=${r.result.safety.nsfwSexual}, 骚扰=${r.result.safety.harassment}, 诈骗=${r.result.safety.scam}`,
				);
				console.log(`  说明: ${r.result.oneLineWhy}`);
			}
		}
	}

	if (errorCount > 0) {
		console.log(`\n${"=".repeat(80)}`);
		console.log("❌ ERROR 样本详情");
		console.log("=".repeat(80));

		const errorResults = results.filter((r) => r.decision === "error");
		for (const r of errorResults) {
			console.log(`\n样本 ${r.index + 1}:`);
			console.log(`  URL: ${r.item.url}`);
			console.log(`  错误: ${r.error || "Unknown error"}`);
		}
	}

	// 性能统计
	console.log(`\n${"=".repeat(80)}`);
	console.log("⏱️  性能统计");
	console.log("=".repeat(80));

	const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / total;
	const minTime = Math.min(...results.map((r) => r.duration));
	const maxTime = Math.max(...results.map((r) => r.duration));

	console.log(`\n平均耗时: ${avgTime.toFixed(0)}ms`);
	console.log(`最快: ${minTime}ms`);
	console.log(`最慢: ${maxTime}ms`);

	printTitleSeparator();
	console.log("✅ 测试完成!");
	printTitleSeparator();
	console.log();
}

main().catch((err) => {
	console.error("\n❌ 脚本执行失败:", err);
	process.exit(1);
});

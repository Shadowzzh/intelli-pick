import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RssConfig } from "@intellipick/config";
import { loadConfig } from "@intellipick/config";
import { type RawContent, toUTCISOString } from "@intellipick/shared";
import { HttpsProxyAgent } from "https-proxy-agent";
import Parser from "rss-parser";
import type { TestSample } from "./test-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 项目根目录（从 packages/test-scripts/src 向上三级）
const PROJECT_ROOT = join(__dirname, "../../../");
const TEST_DATA_DIR = join(PROJECT_ROOT, "test-data");

// 生成带时间戳的唯一文件名
function generateOutputFilename(): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `geekpark-samples-${timestamp}.json`;
}

const OUTPUT_FILE = join(TEST_DATA_DIR, generateOutputFilename());

/**
 * 极客公园 RSS 测试数据采集器
 * 独立运行，采集极客公园 RSS 数据并保存到文件供测试使用
 */
async function main() {
	console.log("🌐 极客公园 RSS 采集测试脚本\n");

	// 1. 加载配置
	console.log("📋 加载配置...");
	console.log(`   工作目录: ${PROJECT_ROOT}`);

	// 切换到项目根目录以便加载 config.ts
	const originalCwd = process.cwd();
	process.chdir(PROJECT_ROOT);

	const config = await loadConfig();
	process.chdir(originalCwd);

	const geekparkSource = config.sources.find((s) => s.name === "极客公园");

	if (!geekparkSource) {
		console.error("❌ 未找到极客公园数据源配置");
		console.error(
			"   请检查 config.sources.ts 中是否有名为 '极客公园' 的数据源",
		);
		process.exit(1);
	}

	if (geekparkSource.type !== "rss") {
		console.error(`❌ 极客公园数据源类型错误: ${geekparkSource.type}`);
		console.error("   期望类型: rss");
		process.exit(1);
	}

	const rssConfig = geekparkSource.config as RssConfig;
	console.log(`   数据源: ${geekparkSource.name}`);
	console.log(`   RSS URL: ${rssConfig.url}`);
	console.log("   ✅ 配置加载完成");

	// 2. 初始化代理
	const proxyUrl =
		config.network?.httpProxy ||
		process.env.HTTP_PROXY ||
		process.env.HTTPS_PROXY;
	let httpAgent: HttpsProxyAgent<string> | undefined;

	console.log("\n🔌 初始化 RSS 解析器...");
	if (proxyUrl) {
		httpAgent = new HttpsProxyAgent(proxyUrl);
		console.log(`   ✅ 代理已配置: ${proxyUrl}`);
	} else {
		console.log("   ℹ️  未配置代理");
	}

	// 3. 初始化 RSS 解析器
	const parser = new Parser(
		httpAgent
			? {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					},
					requestOptions: {
						agent: httpAgent,
						timeout: 10000, // 10秒超时
					},
				}
			: {
					timeout: 10000, // 10秒超时（无代理情况）
				},
	);

	// 4. 采集数据
	console.log("\n📡 开始采集数据...");
	const results: RawContent[] = [];

	try {
		const feed = await parser.parseURL(rssConfig.url);

		for (const item of feed.items || []) {
			results.push({
				sourceType: "rss",
				sourceId: "test-source",
				externalId: item.guid || item.link || "",
				title: item.title || null,
				content: item.contentSnippet || item.content || "",
				url: item.link || "",
				author: item.creator || item.author || null,
				publishedAt: item.pubDate ? toUTCISOString(item.pubDate) : null,
				collectedAt: toUTCISOString(new Date()),
				raw: item,
			});
		}
	} catch (err) {
		console.error(
			"\n❌ 采集失败:",
			err instanceof Error ? err.message : String(err),
		);
		console.error("\n💡 建议:");
		console.error("   - 检查网络连接");
		console.error("   - 检查代理配置是否正确");
		console.error("   - 检查 RSS URL 是否可访问");
		process.exit(1);
	}

	console.log(`   ✅ 成功采集 ${results.length} 条文章`);

	if (results.length === 0) {
		console.warn("\n⚠️  没有采集到数据");
		console.warn("   RSS feed 可能为空或格式不支持");
		console.warn("   脚本将保存空结果并退出");
	}

	// 5. 显示样本预览
	if (results.length > 0) {
		console.log("\n📝 样本预览:");
		console.log("─".repeat(80));
		results.slice(0, 3).forEach((item, index) => {
			console.log(`\n${index + 1}. ${item.title || "(无标题)"}`);
			console.log(
				`   ${item.content.substring(0, 100)}${item.content.length > 100 ? "..." : ""}`,
			);
		});
		if (results.length > 3) {
			console.log(`\n   ... 还有 ${results.length - 3} 条`);
		}
		console.log("─".repeat(80));
	}

	// 6. 保存到文件
	console.log(`\n💾 保存到文件: ${OUTPUT_FILE}`);

	const testData: TestSample = {
		metadata: {
			collectedAt: new Date().toISOString(),
			sourceConfig: geekparkSource.config,
			count: results.length,
		},
		samples: results,
	};

	if (!existsSync(TEST_DATA_DIR)) {
		mkdirSync(TEST_DATA_DIR, { recursive: true });
	}

	writeFileSync(OUTPUT_FILE, JSON.stringify(testData, null, 2), "utf-8");
	console.log("   ✅ 保存成功");

	// 7. 完成
	console.log("\n✅ 测试数据采集完成!");
	console.log(`\n📊 测试数据文件: ${OUTPUT_FILE}`);
	console.log("\n下一步: 运行 AI 测试脚本");
	console.log("   pnpm --filter @intellipick/test-scripts run test:extract");
}

main().catch((err) => {
	console.error("\n❌ 脚本执行失败:", err);
	process.exit(1);
});

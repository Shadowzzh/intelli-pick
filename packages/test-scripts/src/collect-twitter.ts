import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type TwitterConfig, loadConfig } from "@intellipick/config";
import { env } from "@intellipick/env";
import type { RawContent } from "@intellipick/shared";
import { HttpsProxyAgent } from "https-proxy-agent";
import { TwitterApi } from "twitter-api-v2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 项目根目录（从 packages/test-scripts/src 向上三级）
const PROJECT_ROOT = join(__dirname, "../../../");
const TEST_DATA_DIR = join(PROJECT_ROOT, "test-data");

// 生成带时间戳的唯一文件名
function generateOutputFilename(): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `twitter-samples-${timestamp}.json`;
}

const OUTPUT_FILE = join(TEST_DATA_DIR, generateOutputFilename());

interface TestSample {
	metadata: {
		collectedAt: string;
		sourceConfig: unknown;
		count: number;
	};
	samples: RawContent[];
}

/**
 * Twitter 测试数据采集器
 * 独立运行，采集 Twitter 数据并保存到文件供测试使用
 */
async function main() {
	console.log("🐦 Twitter 测试数据采集器\n");

	// 1. 加载配置
	console.log("📋 加载配置...");
	console.log(`   工作目录: ${PROJECT_ROOT}`);

	// 切换到项目根目录以便加载 config.ts
	const originalCwd = process.cwd();
	process.chdir(PROJECT_ROOT);

	const config = await loadConfig();
	process.chdir(originalCwd);

	const twitterSource = config.sources.find(
		(s: { type: string }) => s.type === "twitter",
	);

	if (!twitterSource) {
		console.error("❌ 未找到 Twitter 数据源配置");
		process.exit(1);
	}

	const twConfig = twitterSource.config as TwitterConfig;
	console.log(`   模式: ${twConfig.mode}`);
	console.log(`   最大结果数: ${twConfig.maxResults}`);

	// 2. 检查环境变量
	console.log("\n🔑 检查凭据...");
	if (
		!env.TWITTER_CLIENT_ID ||
		!env.TWITTER_CLIENT_SECRET ||
		!env.TWITTER_ACCESS_TOKEN ||
		!env.TWITTER_REFRESH_TOKEN
	) {
		console.error("❌ Twitter 凭据未配置，请检查环境变量:");
		console.error("   - TWITTER_CLIENT_ID");
		console.error("   - TWITTER_CLIENT_SECRET");
		console.error("   - TWITTER_ACCESS_TOKEN");
		console.error("   - TWITTER_REFRESH_TOKEN");
		process.exit(1);
	}
	console.log("   ✅ 凭据配置完整");

	// 3. 初始化代理
	const proxyUrl =
		config.network?.httpProxy ||
		process.env.HTTP_PROXY ||
		process.env.HTTPS_PROXY;
	let httpAgent: HttpsProxyAgent<string> | undefined;
	if (proxyUrl) {
		httpAgent = new HttpsProxyAgent(proxyUrl);
		console.log("   ✅ 代理已配置");
	} else {
		console.log("   ℹ️  未配置代理");
	}

	// 4. 初始化 Twitter 客户端
	console.log("\n🔌 初始化 Twitter 客户端...");
	const client = new TwitterApi(
		{
			appKey: env.TWITTER_CLIENT_ID,
			appSecret: env.TWITTER_CLIENT_SECRET,
			accessToken: env.TWITTER_ACCESS_TOKEN,
			accessSecret: env.TWITTER_REFRESH_TOKEN,
		},
		{
			httpAgent,
		},
	);
	console.log("   ✅ Twitter 客户端已初始化");

	// 5. 采集数据
	console.log("\n📡 开始采集数据...");
	const results: RawContent[] = [];

	try {
		if (twConfig.mode === "home") {
			console.log("   模式: Home Timeline");
			const timeline = await client.v2.homeTimeline({
				max_results: twConfig.maxResults,
				"tweet.fields": ["created_at", "author_id", "text"],
				expansions: ["author_id"],
			});

			for (const tweet of timeline.data.data || []) {
				results.push({
					sourceType: "twitter",
					sourceId: "test-source",
					externalId: tweet.id,
					title: null,
					content: tweet.text,
					url: `https://twitter.com/i/web/status/${tweet.id}`,
					author: tweet.author_id || null,
					publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
					collectedAt: new Date(),
					raw: tweet,
				});
			}
		} else if (twConfig.mode === "user" && twConfig.usernames) {
			console.log("   模式: User Timeline");
			console.log(`   用户: ${twConfig.usernames.join(", ")}`);

			for (const username of twConfig.usernames) {
				try {
					const user = await client.v2.userByUsername(username);
					if (!user.data) continue;

					const tweets = await client.v2.userTimeline(user.data.id, {
						max_results: twConfig.maxResults,
						"tweet.fields": ["created_at", "text"],
					});

					for (const tweet of tweets.data.data || []) {
						results.push({
							sourceType: "twitter",
							sourceId: "test-source",
							externalId: tweet.id,
							title: null,
							content: tweet.text,
							url: `https://twitter.com/${username}/status/${tweet.id}`,
							author: username,
							publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
							collectedAt: new Date(),
							raw: tweet,
						});
					}
				} catch (err) {
					console.error(
						`   ❌ 获取用户 ${username} 时间线失败:`,
						err instanceof Error ? err.message : String(err),
					);
				}
			}
		} else if (twConfig.mode === "list" && twConfig.listId) {
			console.log("   模式: List Timeline");
			console.log(`   列表 ID: ${twConfig.listId}`);

			const listTweets = await client.v2.listTweets(twConfig.listId, {
				max_results: twConfig.maxResults,
				"tweet.fields": ["created_at", "author_id", "text"],
			});

			for (const tweet of listTweets.data.data || []) {
				results.push({
					sourceType: "twitter",
					sourceId: "test-source",
					externalId: tweet.id,
					title: null,
					content: tweet.text,
					url: `https://twitter.com/i/web/status/${tweet.id}`,
					author: tweet.author_id || null,
					publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
					collectedAt: new Date(),
					raw: tweet,
				});
			}
		}
	} catch (err) {
		console.error(
			"\n❌ 采集失败:",
			err instanceof Error ? err.message : String(err),
		);
		if (err instanceof Error && err.message.includes("429")) {
			console.error("   提示: Twitter API 速率限制，请稍后再试");
		}
		process.exit(1);
	}

	console.log(`   ✅ 成功采集 ${results.length} 条数据`);

	if (results.length === 0) {
		console.warn("\n⚠️  没有采集到数据，脚本退出");
		process.exit(0);
	}

	// 6. 显示样本预览
	console.log("\n📝 样本预览:");
	console.log("─".repeat(80));
	results.slice(0, 3).forEach((item, index) => {
		console.log(`\n${index + 1}. ${item.url}`);
		console.log(
			`   ${item.content.substring(0, 100)}${item.content.length > 100 ? "..." : ""}`,
		);
	});
	if (results.length > 3) {
		console.log(`\n   ... 还有 ${results.length - 3} 条`);
	}
	console.log("─".repeat(80));

	// 7. 保存到文件
	console.log(`\n💾 保存到文件: ${OUTPUT_FILE}`);
	1;
	const testData: TestSample = {
		metadata: {
			collectedAt: new Date().toISOString(),
			sourceConfig: twitterSource.config,
			count: results.length,
		},
		samples: results,
	};

	if (!existsSync(TEST_DATA_DIR)) {
		mkdirSync(TEST_DATA_DIR, { recursive: true });
	}

	writeFileSync(OUTPUT_FILE, JSON.stringify(testData, null, 2), "utf-8");
	console.log("   ✅ 保存成功");

	// 8. 完成
	console.log("\n✅ 测试数据采集完成!");
	console.log(`\n📊 测试数据文件: ${OUTPUT_FILE}`);
	console.log("\n下一步: 运行 AI 测试脚本");
	console.log("   pnpm --filter @intellipick/test-scripts run test");
}

main().catch((err) => {
	console.error("\n❌ 脚本执行失败:", err);
	process.exit(1);
});

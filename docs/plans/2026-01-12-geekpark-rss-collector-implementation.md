# 极客公园 RSS 采集测试脚本实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建独立的测试脚本从极客公园 RSS 源采集测试数据

**Architecture:** 参考 `collect-twitter.ts` 的结构，使用 `rss-parser` 库解析 RSS feed，转换为 `RawContent` 格式并保存到 JSON 文件供后续 AI 测试使用

**Tech Stack:**
- TypeScript (Node.js)
- rss-parser (RSS 解析)
- https-proxy-agent (代理支持)
- @intellipick/config (配置加载)
- @intellipick/shared (类型和工具函数)

---

## Task 1: 添加依赖和 npm 脚本

**Files:**
- Modify: `packages/test-scripts/package.json`

**Step 1: 添加 rss-parser 依赖**

在 `dependencies` 中添加：

```json
"rss-parser": "^3.13.0"
```

完整的 dependencies 应该包含：
```json
"dependencies": {
  "@intellipick/worker": "workspace:*",
  "@intellipick/config": "workspace:*",
  "@intellipick/db": "workspace:*",
  "@intellipick/env": "workspace:*",
  "@intellipick/shared": "workspace:*",
  "@ai-sdk/anthropic": "^1.0.0",
  "@ai-sdk/openai": "^1.0.0",
  "ai": "^4.0.0",
  "drizzle-orm": "^0.38.0",
  "https-proxy-agent": "^7.0.6",
  "rss-parser": "^3.13.0",
  "twitter-api-v2": "^1.18.0",
  "zod": "^3.24.0"
}
```

**Step 2: 添加 npm 脚本**

在 `scripts` 中添加：

```json
"collect:geekpark": "tsx src/collect-geekpark.ts"
```

完整的 scripts 应该包含：
```json
"scripts": {
  "build": "tsc",
  "dev": "tsc --watch",
  "typecheck": "tsc --noEmit",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "collect": "tsx src/collect-twitter.ts",
  "collect:geekpark": "tsx src/collect-geekpark.ts",
  "test:filter": "tsx src/test-ai-filter.ts",
  "test:filter-verbose": "tsx src/test-ai-filter-verbose.ts",
  "test:extract": "tsx src/test-ai-extract.ts",
  "test": "echo 'Please specify which test to run: test:filter, test:filter-verbose or test:extract'"
}
```

**Step 3: 安装依赖**

Run: `pnpm install`
Expected: 安装成功，显示 "dependencies: +1"

**Step 4: 提交更改**

```bash
git add packages/test-scripts/package.json
git commit -m "chore(test-scripts): add rss-parser dependency and collect:geekpark script"
```

---

## Task 2: 创建脚本骨架和类型定义

**Files:**
- Create: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 创建文件并添加导入语句**

创建 `packages/test-scripts/src/collect-geekpark.ts` 并添加：

```typescript
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RssConfig } from "@intellipick/config";
import { loadConfig } from "@intellipick/config";
import { type RawContent, toUTCISOString } from "@intellipick/shared";
import { HttpsProxyAgent } from "https-proxy-agent";
import Parser from "rss-parser";
```

**Step 2: 添加路径常量和辅助函数**

在导入语句后添加：

```typescript
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
```

**Step 3: 添加类型定义**

```typescript
interface TestSample {
	metadata: {
		collectedAt: string;
		sourceName: string;
		sourceType: string;
		sourceUrl: string;
		count: number;
	};
	samples: RawContent[];
}
```

**Step 4: 创建空的 main 函数框架**

```typescript
/**
 * 极客公园 RSS 测试数据采集器
 * 独立运行，采集极客公园 RSS 数据并保存到文件供测试使用
 */
async function main() {
	console.log("🌐 极客公园 RSS 采集测试脚本\n");

	// TODO: 实现功能
}

main().catch((err) => {
	console.error("\n❌ 脚本执行失败:", err);
	process.exit(1);
});
```

**Step 5: 验证文件可以运行**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected: 显示 "🌐 极客公园 RSS 采集测试脚本" 然后正常退出

**Step 6: 提交更改**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "feat(test-scripts): create collect-geekpark script skeleton"
```

---

## Task 3: 实现配置加载功能

**Files:**
- Modify: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 实现配置加载逻辑**

替换 `main` 函数中的 `// TODO: 实现功能` 为：

```typescript
	// 1. 加载配置
	console.log("📋 加载配置...");
	console.log(`   工作目录: ${PROJECT_ROOT}`);

	// 切换到项目根目录以便加载 config.ts
	const originalCwd = process.cwd();
	process.chdir(PROJECT_ROOT);

	const config = await loadConfig();
	process.chdir(originalCwd);

	const geekparkSource = config.sources.find(
		(s) => s.name === "极客公园",
	);

	if (!geekparkSource) {
		console.error("❌ 未找到极客公园数据源配置");
		console.error("   请检查 config.sources.ts 中是否有名为 '极客公园' 的数据源");
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
```

**Step 2: 测试配置加载**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected:
```
🌐 极客公园 RSS 采集测试脚本

📋 加载配置...
   工作目录: /Users/.../intellipick
   数据源: 极客公园
   RSS URL: https://www.geekpark.net/rss
   ✅ 配置加载完成
```

**Step 3: 提交更改**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "feat(test-scripts): implement config loading for geekpark collector"
```

---

## Task 4: 实现代理初始化功能

**Files:**
- Modify: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 添加代理初始化逻辑**

在配置加载代码之后、main 函数中添加：

```typescript
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
```

**Step 2: 测试代理初始化**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected: 在配置加载之后显示代理状态（有代理显示地址，无代理显示 "未配置代理"）

**Step 3: 提交更改**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "feat(test-scripts): add proxy initialization for geekpark collector"
```

---

## Task 5: 实现 RSS 数据采集功能

**Files:**
- Modify: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 添加 RSS 采集逻辑**

在代理初始化代码之后、main 函数中添加：

```typescript
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
```

**Step 2: 测试 RSS 采集（需要网络）**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected: 显示成功采集的文章数量，例如 "✅ 成功采集 25 条文章"

注意：如果网络不可用或需要代理，应该看到友好的错误信息。

**Step 3: 提交更改**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "feat(test-scripts): implement RSS feed parsing for geekpark"
```

---

## Task 6: 实现样本预览功能

**Files:**
- Modify: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 添加样本预览逻辑**

在采集数据代码之后、main 函数中添加：

```typescript
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
```

**Step 2: 测试样本预览**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected: 显示前 3 条文章的标题和内容预览，如果超过 3 条显示剩余数量

**Step 3: 提交更改**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "feat(test-scripts): add sample preview display"
```

---

## Task 7: 实现文件保存功能

**Files:**
- Modify: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 添加文件保存逻辑**

在样本预览代码之后、main 函数中添加：

```typescript
	// 6. 保存到文件
	console.log(`\n💾 保存到文件: ${OUTPUT_FILE}`);

	const testData: TestSample = {
		metadata: {
			collectedAt: new Date().toISOString(),
			sourceName: geekparkSource.name,
			sourceType: geekparkSource.type,
			sourceUrl: rssConfig.url,
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
	console.log("   pnpm --filter @intellipick/test-scripts run test:filter");
```

**Step 2: 测试完整流程**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected:
1. 显示完整的执行流程
2. 在 `test-data/` 目录生成 JSON 文件
3. 显示成功消息和后续步骤提示

**Step 3: 验证生成的 JSON 文件**

Run: `ls -lh test-data/geekpark-samples-*.json | tail -1`
Expected: 显示最新生成的文件及其大小

Run: `cat test-data/geekpark-samples-*.json | head -50`
Expected: 显示 JSON 文件的前 50 行，验证格式正确

**Step 4: 提交更改**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "feat(test-scripts): implement file saving for collected data"
```

---

## Task 8: 代码格式化和最终验证

**Files:**
- Modify: `packages/test-scripts/src/collect-geekpark.ts`

**Step 1: 运行代码格式化**

Run: `pnpm --filter @intellipick/test-scripts format`
Expected: Biome 格式化代码

**Step 2: 运行 lint 检查**

Run: `pnpm --filter @intellipick/test-scripts lint`
Expected: 没有 lint 错误

**Step 3: 运行类型检查**

Run: `pnpm --filter @intellipick/test-scripts typecheck`
Expected: 没有类型错误

**Step 4: 最终完整测试**

Run: `pnpm --filter @intellipick/test-scripts run collect:geekpark`
Expected: 完整流程成功执行，生成测试数据文件

**Step 5: 使用生成的数据测试 AI filter（可选，需要 AI API key）**

Run: `pnpm --filter @intellipick/test-scripts run test:filter test-data/geekpark-samples-*.json`
Expected: AI filter 脚本能够成功读取并处理数据

**Step 6: 提交格式化后的代码**

```bash
git add packages/test-scripts/src/collect-geekpark.ts
git commit -m "style(test-scripts): format collect-geekpark script"
```

---

## Task 9: 更新文档（可选）

**Files:**
- Modify: `packages/test-scripts/README.md` (如果存在)

如果存在 README.md，添加使用说明：

```markdown
## 采集测试数据

### 极客公园 RSS 采集

```bash
pnpm --filter @intellipick/test-scripts run collect:geekpark
```

采集极客公园的最新文章并保存到 `test-data/` 目录。
```

**Step 1: 检查 README 是否存在**

Run: `ls packages/test-scripts/README.md`
Expected: 如果存在，继续；如果不存在，跳过此任务

**Step 2: 如果存在，添加文档**

在 README.md 中添加上述内容

**Step 3: 提交文档更改**

```bash
git add packages/test-scripts/README.md
git commit -m "docs(test-scripts): add geekpark collector usage"
```

---

## 验收标准

脚本完成后应该满足：

1. ✅ 能够加载配置并找到极客公园数据源
2. ✅ 能够解析 RSS feed（有网络连接时）
3. ✅ 能够转换数据为正确的 `RawContent` 格式
4. ✅ 能够保存 JSON 文件且格式正确
5. ✅ 控制台输出清晰、友好
6. ✅ 错误处理完善，不会崩溃
7. ✅ 通过所有 lint 和类型检查
8. ✅ 生成的测试数据可以被 test:filter 和 test:extract 使用

## 后续工作

完成后可以考虑：
- 添加命令行参数支持指定数据源名称
- 重命名为 `collect-rss.ts` 使其更通用
- 添加更多错误恢复机制

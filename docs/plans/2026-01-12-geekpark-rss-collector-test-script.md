# 极客公园 RSS 采集测试脚本设计

**日期**: 2026-01-12
**目标**: 创建一个独立的测试脚本，用于从极客公园 RSS 源采集测试数据

## 概述

创建 `packages/test-scripts/src/collect-geekpark.ts`，用于采集极客公园的 RSS 文章作为测试样本。这个脚本类似于现有的 `collect-twitter.ts`，但专门用于 RSS 数据源。

## 脚本位置

```
packages/test-scripts/src/collect-geekpark.ts
```

## 核心流程

### 1. 加载配置

- 从项目根目录加载 `config.ts`
- 查找名称为 "极客公园" 的数据源配置
- 验证数据源类型为 `rss`
- 提取 RSS URL: `https://www.geekpark.net/rss`

### 2. 初始化 RSS 解析器

- 使用 `rss-parser` 库
- 如果配置了代理 (`config.network.httpProxy`)，创建代理 agent
- 设置 10 秒超时（与 worker 中的 RSS plugin 一致）
- 添加 User-Agent header

### 3. 采集数据

- 调用 `parser.parseURL(rssUrl)` 解析 feed
- 采集 **全部** 返回的文章（通常 10-50 条）
- 转换为 `RawContent` 格式

### 4. 数据转换

将每个 RSS item 转换为 `RawContent`:

```typescript
{
  sourceType: "rss",
  sourceId: "test-source",
  externalId: item.guid || item.link || "",
  title: item.title || null,
  content: item.contentSnippet || item.content || "",
  url: item.link || "",
  author: item.creator || item.author || null,
  publishedAt: item.pubDate ? toUTCISOString(item.pubDate) : null,
  collectedAt: toUTCISOString(new Date()),
  raw: item
}
```

### 5. 保存结果

保存到 `test-data/geekpark-samples-{timestamp}.json`:

```typescript
interface TestSample {
  metadata: {
    collectedAt: string;        // ISO 8601 时间戳
    sourceName: string;          // "极客公园"
    sourceType: string;          // "rss"
    sourceUrl: string;           // RSS feed URL
    count: number;               // 采集到的文章数量
  };
  samples: RawContent[];         // RawContent 数组
}
```

**文件名格式**: `geekpark-samples-2026-01-12T04-30-15-123Z.json`

## 错误处理

### 配置错误

如果找不到极客公园配置或类型不是 RSS：
- 打印错误信息
- 退出脚本 (exit code 1)

### 网络错误

RSS 解析失败时：
- 捕获异常
- 显示友好错误信息
- 提供建议（检查网络连接、代理配置）
- 退出脚本 (exit code 1)

### 空结果

如果 `feed.items` 为空或 undefined：
- 显示警告信息
- 正常保存空数组
- 退出脚本 (exit code 0)

### 文件系统

如果 `test-data/` 目录不存在：
- 使用 `mkdirSync(path, { recursive: true })` 自动创建

## 用户体验

### 控制台输出示例

```
🌐 极客公园 RSS 采集测试脚本

📋 加载配置...
   工作目录: /Users/zhangziheng/Documents/github/intellipick
   数据源: 极客公园
   RSS URL: https://www.geekpark.net/rss
   ✅ 配置加载完成

🔌 初始化 RSS 解析器...
   ✅ 代理已配置: http://127.0.0.1:7890

📡 开始采集数据...
   ✅ 成功采集 25 条文章

📝 样本预览:
────────────────────────────────────────────────────────────────────────────────
1. AI 芯片的下一个战场
   内容预览内容预览内容预览...

2. 苹果发布新款 Vision Pro
   内容预览内容预览内容预览...

3. 特斯拉降价背后的逻辑
   内容预览内容预览内容预览...

   ... 还有 22 条
────────────────────────────────────────────────────────────────────────────────

💾 保存到文件: /Users/.../test-data/geekpark-samples-2026-01-12T04-30-15-123Z.json
   ✅ 保存成功

✅ 测试数据采集完成!

📊 测试数据文件: /Users/.../test-data/geekpark-samples-2026-01-12T04-30-15-123Z.json

下一步: 运行 AI 测试脚本
   pnpm --filter @intellipick/test-scripts run test:filter
```

### 样本预览

- 显示前 3 条文章的标题和内容预览
- 内容预览限制在 100 字符
- 如果超过 3 条，显示剩余数量

## 代码复用

### 依赖包

- `@intellipick/config` - 加载配置
- `@intellipick/shared` - `RawContent` 类型、`toUTCISOString()` 工具
- `rss-parser` - RSS 解析
- Node.js 内置模块: `fs`, `path`, `url`

### 代理处理

需要在 `packages/test-scripts` 中实现或复制 `getNodeProxyAgent()` 函数：

```typescript
import { Agent } from "node:http";

function getNodeProxyAgent(): Agent | undefined {
  const proxyUrl = config.network?.httpProxy ||
                   process.env.HTTP_PROXY ||
                   process.env.HTTPS_PROXY;

  if (proxyUrl) {
    // 返回代理 agent (需要依赖库支持)
  }
  return undefined;
}
```

## NPM 脚本

在 `packages/test-scripts/package.json` 添加：

```json
{
  "scripts": {
    "collect:geekpark": "tsx src/collect-geekpark.ts"
  }
}
```

## 使用方法

```bash
# 在项目根目录运行
pnpm --filter @intellipick/test-scripts run collect:geekpark

# 或在 packages/test-scripts 目录内运行
pnpm run collect:geekpark
```

## 后续使用

采集的测试数据可用于：

1. **AI Filter 测试**:
   ```bash
   pnpm --filter @intellipick/test-scripts run test:filter test-data/geekpark-samples-xxx.json
   ```

2. **AI Extract 测试**:
   ```bash
   pnpm --filter @intellipick/test-scripts run test:extract test-data/geekpark-samples-xxx.json
   ```

## 扩展性

这个脚本可以作为模板，支持其他 RSS 数据源的测试：

- 可以添加命令行参数指定数据源名称
- 可以重命名为 `collect-rss.ts` 使其更通用
- 例如: `pnpm run collect:rss "知乎热榜"`

## 技术细节

### RSS Parser 配置

```typescript
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  requestOptions: {
    agent: httpAgent,     // 可选的代理 agent
    timeout: 10000        // 10 秒超时
  }
});
```

### 时间戳格式

使用 `toUTCISOString()` 确保时区处理正确：
- `publishedAt`: RSS item 的发布时间（如果有）
- `collectedAt`: 当前采集时间（UTC）

### 文件名生成

```typescript
function generateOutputFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `geekpark-samples-${timestamp}.json`;
}
```

将 ISO 8601 时间戳中的 `:` 和 `.` 替换为 `-`，避免文件系统兼容性问题。

## 测试验证

脚本成功标准：

1. ✅ 能够加载配置并找到极客公园数据源
2. ✅ 能够解析 RSS feed（有网络连接时）
3. ✅ 能够转换数据为正确的 `RawContent` 格式
4. ✅ 能够保存 JSON 文件且格式正确
5. ✅ 控制台输出清晰、友好
6. ✅ 错误处理完善，不会崩溃

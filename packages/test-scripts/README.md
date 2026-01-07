# @intellipick/test-scripts

IntelliPick 测试脚本包。用于测试 AI filter 和 AI extract 功能。

## 可用脚本

### 1. collect-twitter.ts
采集 Twitter 数据并保存为测试样本。

**特点**：
- 每次运行创建带时间戳的新文件，不会覆盖历史数据
- 文件命名格式：`twitter-samples-{timestamp}.json`

```bash
pnpm --filter @intellipick/test-scripts run collect
```

### 2. test-ai-filter.ts
测试 AI 质量评分和安全检查功能。

```bash
# 使用最新的测试数据
pnpm --filter @intellipick/test-scripts run test:filter

# 指定测试数据文件
pnpm --filter @intellipick/test-scripts run test:filter test-data/twitter-samples-2026-01-07T10-30-45-123Z.json
```

### 3. test-ai-extract.ts
测试 AI 实体提取和分类功能。

```bash
# 使用最新的测试数据
pnpm --filter @intellipick/test-scripts run test:extract

# 指定测试数据文件
pnpm --filter @intellipick/test-scripts run test:extract test-data/twitter-samples-2026-01-07T10-30-45-123Z.json
```

## 完整工作流程

### 1. 采集测试数据
```bash
pnpm --filter @intellipick/test-scripts run collect
```
输出：`test-data/twitter-samples-{timestamp}.json`

### 2. 运行 AI 测试

#### 测试 AI Filter（质量评分和安全检查）
```bash
# 方式 1: 自动使用最新的测试数据（推荐）
pnpm --filter @intellipick/test-scripts run test:filter

# 方式 2: 指定某个特定的测试数据文件
pnpm --filter @intellipick/test-scripts run test:filter test-data/twitter-samples-2026-01-07T10-30-45-123Z.json
```

#### 测试 AI Extract（实体提取和分类）
```bash
# 方式 1: 自动使用最新的测试数据（推荐）
pnpm --filter @intellipick/test-scripts run test:extract

# 方式 2: 指定某个特定的测试数据文件
pnpm --filter @intellipick/test-scripts run test:extract test-data/twitter-samples-2026-01-07T10-30-45-123Z.json
```

## 文件查找逻辑

测试脚本会按以下优先级查找测试数据文件：

1. **命令行指定的文件** - 如果提供了文件路径参数
2. **默认文件** - `test-data/twitter-samples.json`（如果存在）
3. **最新文件** - 自动查找 `test-data/twitter-samples-*.json` 中最新的文件
4. **报错** - 如果找不到任何测试数据文件

## 输出文件

所有测试相关文件保存在 `test-data/` 目录：

### 测试数据文件
- `twitter-samples-{timestamp}.json` - 采集的 Twitter 测试样本（每次运行生成新文件）
- `twitter-samples.json` - 默认测试数据文件（可选）

### 测试结果文件
- `test-results-{timestamp}.json` - AI 测试结果（每次运行生成新文件）

## 前置要求

### 环境变量
在项目根目录的 `.env` 文件中配置：

```bash
# Twitter API 凭据
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_REFRESH_TOKEN=your_refresh_token

# AI 提供商 API Key（根据你的配置选择）
ANTHROPIC_API_KEY=your_anthropic_key
# 或
DEEPSEEK_API_KEY=your_deepseek_key
```

### 配置文件
在项目根目录的 `config.ts` 文件中配置 Twitter 数据源：

```typescript
export default defineConfig({
  sources: [
    {
      type: "twitter",
      config: {
        mode: "home",  // 或 "user"、"list"
        maxResults: 10,
        usernames: ["elonmusk", "OpenAI"],  // mode: "user" 时需要
        listId: "12345678",  // mode: "list" 时需要
      },
    },
  ],
  // ... 其他配置
});
```

## 使用场景示例

### 场景 1: 快速测试
```bash
# 采集最新数据
pnpm --filter @intellipick/test-scripts run collect

# 使用最新数据测试 AI Filter
pnpm --filter @intellipick/test-scripts run test:filter

# 使用最新数据测试 AI Extract
pnpm --filter @intellipick/test-scripts run test:extract
```

### 场景 2: 对比不同时间的测试结果
```bash
# 第一次采集
pnpm --filter @intellipick/test-scripts run collect
# 生成: test-data/twitter-samples-2026-01-07T10-00-00-000Z.json

# 第二次采集（修改配置后）
pnpm --filter @intellipick/test-scripts run collect
# 生成: test-data/twitter-samples-2026-01-07T14-00-00-000Z.json

# 对比测试
pnpm --filter @intellipick/test-scripts run test:filter test-data/twitter-samples-2026-01-07T10-00-00-000Z.json
pnpm --filter @intellipick/test-scripts run test:filter test-data/twitter-samples-2026-01-07T14-00-00-000Z.json
```

### 场景 3: 只运行测试，不采集新数据
```bash
# 脚本会自动使用 test-data/ 目录中最新的测试数据
pnpm --filter @intellipick/test-scripts run test:filter
```

## 常见问题

### Q: 如何查看有哪些测试数据文件？
```bash
ls -lh test-data/twitter-samples-*.json
```

### Q: 如何找到最新的测试数据文件？
```bash
ls -t test-data/twitter-samples-*.json | head -1
```

### Q: 测试脚本找不到测试数据文件怎么办？
确保先运行采集脚本：
```bash
pnpm --filter @intellipick/test-scripts run collect
```

### Q: 如何清理旧的测试数据文件？
```bash
# 删除所有测试数据文件
rm test-data/twitter-samples-*.json

# 删除所有测试结果文件
rm test-data/test-results-*.json

# 或只保留最新的 N 个文件
ls -t test-data/twitter-samples-*.json | tail -n +4 | xargs rm
```

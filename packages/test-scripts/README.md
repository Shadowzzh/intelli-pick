# IntelliPick 测试与审计脚本

该包提供数据采集样本、AI 结构化提取验证和本地去重审计工具。活动内容 Pipeline 已移除 AI Filter，因此不再提供质量评分或隔离决策测试脚本。

## 可用命令

### 采集 Twitter 样本

```bash
pnpm --filter @intellipick/test-scripts run collect
```

需要在环境变量中配置 Twitter 凭据。输出保存在 `test-data/`，默认不会提交 Git。

### 采集极客公园样本

```bash
pnpm --filter @intellipick/test-scripts run collect:geekpark
```

### 验证 AI 提取

```bash
pnpm --filter @intellipick/test-scripts run test:extract
pnpm --filter @intellipick/test-scripts run test:extract test-data/twitter-samples.json
```

脚本验证 `extractAndClassify` 的标题、摘要、关键要点、数据点、分类、标签和实体输出。

### 验证内容去重

```bash
pnpm --filter @intellipick/test-scripts run test:dedup
```

### 审计生产内容候选

审计命令从标准输入读取 JSON 数组，不会直接连接或修改数据库：

```bash
pnpm --filter @intellipick/test-scripts audit:dedup < contents.json
```

阈值和生产验收说明见 `docs/content-dedup-audit.md`。

## 数据文件选择

AI 提取脚本按以下顺序选择输入：

1. 命令行指定的文件。
2. `test-data/twitter-samples.json`。
3. `test-data/` 中最新的 `twitter-samples-*.json`。

没有可用样本时，脚本会退出并提示先执行采集命令。

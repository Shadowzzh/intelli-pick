# Sift AI 性能监控与 Linux.do 热门源运行说明

## 目的

本文记录 2026-08-26 上线的两项能力：

- 通过 `https://linux.do/hot.rss` 采集 Linux.do 热门主题。
- 记录并展示内容过滤与实体提取的真实 AI 调用指标。

正式运行环境为 NAS：`/home/ziheng/intellipick`。Compose 使用：

- `/home/ziheng/intellipick/docker-compose.yml`
- `/home/ziheng/intellipick/docker-compose.nas.yml`

## Linux.do 热门源

数据源配置位于 `config.sources.ts`：

- 名称：`LINUX DO 热门`
- URL：`https://linux.do/hot.rss`
- 类型：`rss`
- 获取方式：`curl`
- 周期：每 2 小时
- Cron：`15 */2 * * *`

使用第 15 分钟执行，是为了与偶数整点运行的 `LINUX DO 非我莫属` 招聘源错开，降低同时请求导致 HTTP 429 的概率。

普通 RSS 插件支持 `fetchMethod: "curl"`。curl 的最大请求时间为 12 秒，低于普通内容调度器的 15 秒超时，避免子进程仍在运行时调度器已经判定失败。

## AI 指标口径

监控窗口固定为最近 24 小时。

### 调用与成功率

- 调用次数：实际发起 AI 请求的次数。
- 成功率：AI 返回并通过结构化 Schema 校验的调用数除以调用总数。
- 通过率：最终过滤决策为 `pass` 的次数除以成功过滤次数。
- `reject` 和 `quarantine` 是正常业务决策，不属于 AI 调用失败。

### 响应时间

- 单任务平均响应：该任务全部 AI 调用耗时的平均值。
- 综合平均响应：过滤与实体提取全部调用耗时的平均值。
- 单位为毫秒。

### Token

- 输入：发送给模型的全部 prompt token。
- 输出：模型生成的全部 completion token。
- 总计：输入与输出 token 之和。
- 缓存：输入 token 中命中上游 prompt cache 的部分，已经包含在输入和总计中。
- 推理：输出 token 中由上游单独报告的 reasoning token，已经包含在输出和总计中。

缓存和推理 token 是子集，不能再次加到总 token 上。上游没有提供细分数据时，单次调用记录为 `null`；聚合总量按 0 处理。

### 模型

每次调用同时保存：

- `configuredModel`：Sift 请求时配置的模型。
- `responseModel`：上游响应实际报告的模型。
- `provider`：任务配置使用的 provider。
- `protocol`：`responses`、`chat-completions` 或 `anthropic`。

NAS 原配置：

- 过滤：`gpt-5.6-luna`
- 实体提取：`gpt-5.6-terra`
- AI Chat：`gpt-5.6-luna`
- Provider：`codex`
- 协议：OpenAI Responses

2026-08-27 起，过滤与实体提取曾切换为：

- 过滤：`deepseek-v4-flash`
- 实体提取：`deepseek-v4-flash`
- Provider：`volcAgentPlan`
- 协议：OpenAI Chat Completions
- AI Chat 保持 `codex` 与 `gpt-5.6-luna`

随后活动内容 Pipeline 移除 AI Filter。当前普通内容只调用一次
`extractAndClassify`，监控页只展示“实体提取与分类”。近 24 小时 API
仍会保留切换前的过滤历史指标，但前端不再展示；窗口过期后过滤调用自然归零。

两个任务可通过环境变量独立切换：

```text
AI_FILTER_PROVIDER=volcAgentPlan
AI_FILTER_MODEL=deepseek-v4-flash
AI_EXTRACT_AND_CLASSIFY_PROVIDER=volcAgentPlan
AI_EXTRACT_AND_CLASSIFY_MODEL=deepseek-v4-flash
```

回退到原模型时，将 Provider 分别改为 `codex`，并把模型恢复为
`gpt-5.6-luna` 与 `gpt-5.6-terra`。Agent Plan 凭据只保存在部署环境，
不写入仓库。

切换前使用 3 条真实内容与 2 条合成安全样本完成隔离测试：

- 过滤 5/5 次通过结构化 Schema 校验。
- 实体提取 3/3 次通过结构化 Schema 校验。
- 3 条真实内容的过滤决策与一级分类全部一致。
- 同样本过滤平均耗时降低约 33%，Token 减少约 60%。
- 同样本实体提取平均耗时降低约 42%，Token 减少约 39%。

## 数据流

1. `AiExtractStep` 记录调用结果、耗时、token 和模型信息。
2. `Pipeline.process()` 将本次内容处理的指标返回给 BullMQ Worker。
3. Worker 把完整结果写入现有 `job_history.return_value` JSONB。
4. API 查询最近 24 小时的任务结果并聚合。
5. Web 监控页每 10 秒刷新并展示最新数据。

没有新增数据库字段或迁移。旧任务记录不含 `aiMetrics`，聚合时会自动忽略。

## 无样本状态

部署后尚未产生新格式任务时：

- 调用次数显示 0。
- 成功率、通过率和平均响应显示 `--`。
- 状态显示“暂无数据”，不显示“需关注”。
- 配置模型、provider 和协议仍正常显示。

## 上线验证

2026-08-26 曾使用一条尚未处理的真实 Block Beats 快讯完成双阶段端到端验证：

- URL：`https://www.theblockbeats.info/flash/363720`
- 过滤模型：`gpt-5.6-luna`
- 过滤 token：5,489
- 实体提取模型：`gpt-5.6-terra`
- 实体提取 token：7,062
- 总 token：12,551
- 配置模型与响应模型一致
- 内容完成过滤、提取并正常入库

自动验证包括：

- 仓库级类型检查 17/17 通过。
- AI 聚合测试 2/2 通过。
- Worker 指标字段提取测试通过。
- Biome 与 `git diff --check` 通过。
- Worker、API、Web 生产构建通过。
- NAS API 与 Web 健康检查返回 HTTP 200。

全量 API 测试中有 5 个既有数据库集成测试因本机已停用的 PostgreSQL 未运行而失败。目标测试、生产构建和 NAS 正式数据库验证均通过。

## 状态与日志

查看容器：

```bash
ssh nas "docker ps --filter name=intellipick"
```

查看 Worker 日志：

```bash
ssh nas "docker logs --tail 200 intellipick-worker"
```

查看 API 日志：

```bash
ssh nas "docker logs --tail 200 intellipick-api"
```

查看 Web 日志：

```bash
ssh nas "docker logs --tail 100 intellipick-web"
```

本轮本地验证日志保存在：

```text
~/.codex/user-output/2026-08-26/intellipick-ai-metrics-日志/
```

## 回滚

部署前源码备份：

```text
/home/ziheng/intellipick/.codex-backups/20260826-230000-ai-metrics.tar.gz
```

回滚镜像：

```text
intellipick-worker:rollback-ai-metrics-20260826-230000
intellipick-api:rollback-ai-metrics-20260826-230000
intellipick-web:rollback-ai-metrics-20260826-230000
```

回滚时先恢复源码，再把三个回滚镜像重新标记为 `:local`，最后仅重建对应容器。数据库没有结构变更，不需要执行数据库回滚。

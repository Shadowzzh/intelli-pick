# Sift 任务详情实时与历史回退

## 目的

队列列表中的任务可能在用户点击详情前已经完成，并因 `removeOnComplete: true` 从 BullMQ 删除。任务详情必须自动回退到 PostgreSQL 执行历史，不能要求用户手动去另一个组件重新搜索。

## 数据职责

- BullMQ：等待中、处理中以及仍保留的实时任务状态。
- PostgreSQL `job_history`：任务完成或失败后的持久化记录。

不为了详情功能长期保留所有 BullMQ 完成任务，避免 Redis 持续增长和自定义 `jobId` 被已完成任务占用。

## 查询流程

1. 请求实时详情：`GET /api/v1/queue/jobs/:jobId`。
2. 实时任务存在时返回 `origin=queue`。
3. 实时接口返回 404 时，查询：`GET /api/v1/job-history/job/:jobId`。
4. 历史记录存在时返回 `origin=history`。
5. 为处理刚完成但历史监听器尚未写入的短暂竞态，历史查询最多在 150ms 和 350ms 后快速重试两次。
6. 两边都不存在时立即显示真正的未找到状态。

任务 ID 必须使用 `encodeURIComponent(jobId)` 写入 URL。RSS 任务 ID 中包含 `/`，不编码会被路由拆成多个路径段。

## 重试策略

- 明确的 `NOT_FOUND` 不使用 TanStack Query 默认重试。
- 网络或服务端错误最多额外重试 1 次。
- 实时等待中或处理中任务每 2 秒刷新。
- 任务完成并转入历史后停止轮询。

## API 错误格式

实时队列详情和执行历史详情在记录不存在时统一返回标准 HTTP 404：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "..."
  }
}
```

禁止使用 HTTP 200 加 `{ "success": false }`，否则前端 API 封装会得到 `undefined`，并触发不必要的查询重试。

## Web 交互

- 按钮文案为“任务详情”，包含查看图标和手型指针。
- 弹窗打开后立即显示加载状态。
- 弹窗顶部标记“实时队列”或“执行历史”。
- 实时详情展示任务数据、重试次数、时间线、错误和返回值。
- 历史详情展示持久化状态、耗时、原始链接、错误和处理结果。
- 两边都不存在时显示“重新获取”按钮。

## 验证

自动验证包括：

- 详情接口标准 404 测试 2/2 通过。
- 仓库级类型检查 17/17 通过。
- API 与 Web 生产构建通过。
- NAS API 与 Web 健康检查返回 HTTP 200。

生产验证使用真实历史任务：

```text
rss-https-//www.theblockbeats.info/flash/363720
```

结果：

- 实时队列接口：HTTP 404、`NOT_FOUND`。
- 执行历史接口：HTTP 200。
- 自动回退链路约 52ms。
- 返回的历史任务 ID 与请求一致。

实时路径使用一个延迟 60 秒的临时任务验证，详情接口返回 HTTP 200 后立即删除。该任务没有进入 AI 处理或数据库。

## 日志与回滚

本轮验证日志：

```text
~/.codex/user-output/2026-08-27/intellipick-task-detail-日志/
```

部署前源码备份：

```text
/home/ziheng/intellipick/.codex-backups/20260827-002500-task-detail-source.tar.gz
```

回滚镜像：

```text
intellipick-api:rollback-task-detail-20260827-002500
intellipick-web:rollback-task-detail-20260827-002500
```

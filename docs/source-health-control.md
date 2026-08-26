# Sift 数据源健康与运行开关

## 目的

本文记录 2026-08-26 上线的数据源健康状态和运行时启用/禁用控制。

正式环境位于 NAS：`/home/ziheng/intellipick`。

## 运行状态真源

`sources.enabled` 是运行时启用状态的唯一真源。

- 新数据源第一次写入数据库时，使用 `config.sources.ts` 中的 `enabled` 作为初始值。
- 已存在的数据源同步配置时保留数据库中的 `enabled`，不再被配置文件覆盖。
- Web/API 修改 `enabled` 后立即持久化，Worker 或容器重启后仍保持用户选择。
- 配置中已删除的数据源会设置 `is_configured=false` 和 `enabled=false`，保留历史内容但不再显示在主健康列表。

## Worker 调度

Worker 为所有当前配置源创建 Cron。每次 Cron 触发时先查询数据库：

- `is_configured=true` 且 `enabled=true`：执行采集。
- `is_configured=false` 或 `enabled=false`：记录跳过日志，不发起外部请求。

禁用不会强制中断已经开始的采集，只影响后续触发。重新启用后等待下一次定时任务，不会自动立即采集。

## API

更新运行状态：

```http
PATCH /api/v1/sources/:id/enabled
Content-Type: application/json

{
  "enabled": false
}
```

接口受现有登录认证保护。已从配置移除的数据源不能重新启用。

查询健康状态：

```http
GET /api/v1/sources/health
```

## 健康字段

`sources` 表记录：

- `last_attempted_at`：最近一次开始尝试采集的时间。
- `last_fetched_at`：最近一次成功采集完成的时间。
- `last_fetch_status`：`never`、`running`、`success` 或 `failed`。
- `last_fetch_error`：最近一次失败原因。
- `last_item_count`：最近一次拉取数量。
- `last_new_count`：最近一次新增入队数量。
- `last_duration_ms`：最近一次采集耗时。
- `is_configured`：是否仍存在于当前配置。
- `schedule_minute`：小时间隔任务在每小时的执行分钟。

数据库迁移：

```text
packages/db/drizzle/0007_bitter_roxanne_simpson.sql
```

迁移会使用 `contents.collected_at` 为历史源回填最近成功时间。没有历史内容的源保持 `never`。

## 健康状态口径

- `disabled`：用户已停用。
- `pending`：已启用，但没有成功采集记录，也没有明确失败。
- `error`：最近一次采集失败，或最后成功时间超过 `3 × fetchInterval`。
- `delayed`：最后成功时间超过 `1.5 × fetchInterval`，但没有超过 `3 × fetchInterval`。
- `healthy`：最后成功时间不超过 `1.5 × fetchInterval`。

最近一次失败优先判定为 `error`，即使此前存在成功记录，也会展示真实错误信息。

## Web 控制

监控页每个当前配置源提供“停用/启用”按钮：

- 点击后先乐观更新页面。
- 请求期间禁用全部源的开关，防止并发切换。
- API 失败时恢复原状态并显示错误提示。
- 请求结束后重新读取监控和数据源缓存。
- 停用源保留最后成功时间、数量、错误和历史内容。
- 可点击按钮显示手型指针，请求进行中显示加载状态并临时锁定其他按钮。

最后成功时间按长度自动显示为分钟、小时、天、周或月。

## 上线验证

上线时完成以下验证：

- 数据库迁移成功，历史成功时间完成回填。
- 3 个不在当前配置中的历史源被标记为已移除并禁用。
- 健康接口只返回 12 个当前配置源。
- 临时启用 `LINUX DO 快讯` 后，Worker 重启仍保持启用。
- 随后恢复禁用，API 返回 `healthStatus=disabled`。
- 00:00 调度确认禁用的 `LINUX DO 快讯` 记录 `Skipping disabled source`，没有发起请求。
- 成功源完成状态、拉取数量、新增数量和耗时回写。
- Hacker News、GitHub 趋势、infoQ 和极客公园真实记录为 15 秒采集超时。
- 调度完成后的汇总为 7 个健康、4 个失败、1 个禁用。
- Worker、API、Web 和 PostgreSQL 容器健康检查通过。

## 状态与日志

查看数据源采集日志：

```bash
ssh nas "docker logs --tail 300 intellipick-worker | grep source-scheduler"
```

查看数据库状态：

```bash
ssh nas "docker exec intellipick-db psql -U postgres -d intellipick -c 'select name, enabled, is_configured, last_fetch_status, last_fetched_at from sources order by name;'"
```

本轮验证日志：

```text
~/.codex/user-output/2026-08-26/intellipick-source-health-日志/
```

## 备份与回滚

部署前数据库备份：

```text
/home/ziheng/intellipick/.codex-backups/20260826-234500-source-health-db.dump
```

部署前源码备份：

```text
/home/ziheng/intellipick/.codex-backups/20260826-234500-source-health-source.tar.gz
```

回滚镜像：

```text
intellipick-worker:rollback-source-health-20260826-234500
intellipick-api:rollback-source-health-20260826-234500
intellipick-web:rollback-source-health-20260826-234500
```

迁移只增加列，旧镜像可以忽略这些列。通常只需恢复源码和三个旧镜像，不需要回滚数据库。只有严格恢复迁移前数据时才使用数据库 dump。

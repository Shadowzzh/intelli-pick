# 系统监控数据口径

本文记录系统监控页“系统概览”和“依赖与 API 状态”的数据来源与健康判定规则。

## 系统概览

- 总内容数：`contents` 表的实时总行数。
- 今日新增：按 `contents.created_at` 统计上海时间当日新入库内容。
- 队列中任务：BullMQ 当前 `waiting + active` 数量。
- Worker 数：通过 BullMQ `Queue.getWorkers()` 读取 Redis 中注册的 Worker，队列空闲时仍能识别在线 Worker。
- 系统状态：综合数据库、Redis、Worker、队列、数据源、AI 和 API 指标。

系统状态为“异常”的条件：

- 数据库或 Redis 无法连接。
- 存在启用的数据源但没有注册中的 Worker。
- 队列失败数超过 50，或等待数超过 500。
- 全部启用数据源均处于错误状态。
- API 至少有 5 个样本且服务端错误率不低于 20%。

系统状态为“警告”的条件：

- 队列失败数超过 10，或等待数超过 100。
- 存在错误、延迟或尚未完成首次采集的数据源。
- 实体提取与分类成功率低于 95%。
- API 至少有 5 个样本且服务端错误率不低于 5%。

## 数据库与 Redis

数据库状态通过实时查询 PostgreSQL 验证，同时读取当前数据库连接数。

Redis 状态通过现有 BullMQ 连接执行 `PING` 验证，并从 `INFO memory` 读取：

- `used_memory`：当前已使用内存。
- `maxmemory`：配置的内存上限；值为 0 时显示“未设置上限”。

## API 统计

API 指标保存在 API 进程内存中，使用最近 10 分钟滚动窗口：

- 业务请求数：窗口内已完成且未被排除的请求数量。
- 平均响应：窗口内 `reply.elapsedTime` 的平均值。
- 服务端错误率：HTTP 5xx 请求数除以窗口内请求总数。

以下请求不计入统计：

- `/health` 容器健康检查。
- `/api/v1/monitoring` 监控页自身轮询。
- `/socket.io` 实时连接请求。

API 容器重启后窗口数据从零重新累计，不写入数据库。

## Worker 外部心跳

Worker 可选向 Uptime Kuma Push monitor 周期上报心跳。Push URL 只保存在生产环境变量中，不写入仓库；未配置时心跳功能保持关闭。

环境变量和验证方法见 [`worker-heartbeat.md`](worker-heartbeat.md)。

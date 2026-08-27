# Worker 在线状态与 Uptime Kuma 心跳

## 目标

- 队列空闲时仍能识别在线 Worker。
- Worker 停止或失去上报能力后，由 Uptime Kuma 在宽限期后告警。
- Push Token 只保存在生产运行环境，不进入 Git、普通日志或文档。

## 内部在线状态

API 使用 BullMQ `Queue.getWorkers()` 读取 Redis 客户端列表中的注册 Worker：

- `workers.total`：当前注册 Worker 数。
- `workers.active`：注册 Worker 数与 active job 数的较小值。
- 存在启用数据源但 `workers.total` 为 0 时，系统状态为 `error`。

该口径不再使用 active job 数冒充 Worker 数，因此队列空闲时不会显示 Worker 离线。

## Uptime Kuma Push

Worker 支持以下可选环境变量：

```text
UPTIME_KUMA_PUSH_URL=
UPTIME_KUMA_PUSH_INTERVAL_SECONDS=30
UPTIME_KUMA_PUSH_TIMEOUT_MS=10000
```

运行行为：

- 配置 Push URL 后，Worker 启动时立即上报一次，随后按间隔上报。
- 每次上报使用 `status=up` 和固定状态说明。
- 单次上报超时或返回非成功响应时记录错误，但不终止 Worker。
- Worker 优雅退出时停止定时器，不主动发送 DOWN；由 Uptime Kuma 的缺失心跳宽限期判断离线。
- 未配置 Push URL 时，日志记录心跳已禁用，不发起外部请求。

建议 Uptime Kuma interval 为 90 秒，Worker 每 30 秒上报一次。这样允许单次网络抖动，同时能在约 2 分钟内发现停止上报。

## 状态与日志

```bash
docker compose -f docker-compose.yml ps intellipick-worker
docker compose -f docker-compose.yml logs --tail 100 intellipick-worker
curl -fsS http://127.0.0.1:8085/api/v1/monitoring
```

日志只记录是否启用、上报成功或失败，不展开 Push URL 和 Token。

## 回滚

1. 从生产环境删除 `UPTIME_KUMA_PUSH_URL`，重建或重启 Worker 即可关闭外部心跳。
2. 回滚 API 和 Worker 镜像后，监控 API 会恢复旧口径。
3. Uptime Kuma Push monitor 可以先停用观察，不需要删除历史心跳。

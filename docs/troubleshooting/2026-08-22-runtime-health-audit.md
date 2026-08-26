# IntelliPick 运行健康检查记录

## 基本信息

- 项目：IntelliPick
- 检查日期：2026-08-22
- 检查时段：上海时间约 10:30-10:55
- 运行环境：Mac mini + Docker Compose
- 公网入口：`http://120.55.127.195:8080`
- 公网转发：FRPC HTTP proxy
- 检查方式：只读检查，没有修改配置、重启服务或清理数据
- 时间说明：应用 JSON 日志中的 `Z` 时间为 UTC，本文已尽量换算为上海时间（UTC+8）

## 结论摘要

IntelliPick 的 Web、API、PostgreSQL、Redis、RSSHub 和 Worker 均在运行，公网入口和 FRPC 转发链路可用，队列当前没有积压。

当前主要风险不在服务存活，而在采集可靠性和监控可信度：

1. 所有 2 小时数据源集中在同一个整点执行，形成 RSSHub 请求突发。
2. 最近多个源在统一的 15 秒边界超时。
3. Block Beats、Hacker News 和极客公园存在长期采集异常。
4. `sources.last_fetched_at` 从未被采集流程更新，导致监控页面把所有启用源都判为异常。
5. 数据库仍保留三个已不在当前配置中的启用源，页面统计与实际调度数量不一致。
6. Collector 会吞掉采集异常并返回空数组，调度器随后可能把失败记录成 `Collection completed`。
7. 当前工作区和运行镜像并非同一个代码快照，后续重新构建前需要先确认未提交改动。

## 部署基线

Compose 中的主要服务如下：

| 服务 | 容器 | 监听方式 | 检查结果 |
| --- | --- | --- | --- |
| Web | `intellipick-web` | `0.0.0.0:8080` | 运行中，healthy |
| API | `intellipick-api` | `127.0.0.1:8085` | 运行中，healthy |
| Worker | `intellipick-worker` | 无对外端口 | 运行中，无容器 healthcheck |
| PostgreSQL | `intellipick-db` | `127.0.0.1:15432` | 运行中，healthy |
| Redis | `intellipick-redis` | 仅 Compose 网络 | 运行中，healthy |
| RSSHub | `intellipick-rsshub` | `127.0.0.1:1200` | 运行中，healthy |

检查时所有容器的 restart count 均为 0，未发现 OOMKilled。

Compose 配置通过以下只读校验：

```bash
docker compose --env-file .env.production config --quiet
```

## 连通性检查

### 本机链路

- `http://127.0.0.1:8085/health` 返回 HTTP 200，约 16ms。
- `http://127.0.0.1:8080/` 返回 HTTP 200，约 3ms。
- `http://127.0.0.1:8085/api/v1/monitoring` 可正常返回 JSON。

### 公网链路

- 匿名访问公网入口返回 HTTP 401，符合 FRPC Basic Auth 配置预期。
- 使用现有认证访问公网首页返回 HTTP 200，约 40ms。
- 使用现有认证访问 `/api/v1/monitoring` 返回 HTTP 200，约 62ms。
- FRPC 由 `/Library/LaunchDaemons/com.frpc.plist` 托管，检查时状态为 `running`。
- FRPC 日志显示 `intellipick-ip` proxy 已成功启动。

公网健康检查路径目前不完整：

- Web Nginx 只把 `/api/` 转发给 API。
- API 健康路由实际为 `/health`。
- 公网 `/health` 会落到 SPA fallback，返回前端 HTML。
- 公网 `/api/health` 被转发到 API 后返回 404。

因此目前不能用公网 `/health` 判断 API 是否健康。可以暂时使用 `/api/v1/monitoring` 做端到端验证，后续应增加明确的公网 API health 路由。

## 数据源配置

当前代码配置与预期采集周期一致：

| 数据源 | 状态 | 周期 |
| --- | --- | --- |
| Block Beats | 启用 | 2 小时 |
| Hacker News | 启用 | 2 小时 |
| LINUX DO 快讯 | 禁用 | 2 小时配置，不参与调度 |
| V2EX 热门 | 启用 | 2 小时 |
| 少数派首页 | 启用 | 2 小时 |
| 知乎热榜 | 启用 | 2 小时 |
| readhub早报 | 启用 | 2 小时 |
| infoQ | 启用 | 2 小时 |
| 极客公园 | 启用 | 2 小时 |
| github 趋势 | 启用 | 2 小时 |
| 36氪热榜 | 启用 | 4 小时 |

Worker 启动日志确认实际创建了 10 个调度任务，时区为 `Asia/Shanghai`：

- 2 小时源使用 `0 */2 * * *`。
- 36氪使用 `0 */4 * * *`。
- `RUN_INITIAL_COLLECTION=false`，Worker 重启后不会立即采集，而是等待下一个整点。

## 最近一轮采集结果

以下时间均为上海时间 2026-08-22 10:00 左右，36氪为 08:00：

| 数据源 | 最近调度结果 | 拉取数量 | 新增队列任务 | 备注 |
| --- | --- | ---: | ---: | --- |
| Block Beats | 表面 completed | 0 | 0 | Collector 实际收到 RSSHub 503 |
| Hacker News | timeout | - | - | 15 秒调度超时，底层请求随后继续到 30 秒超时 |
| V2EX 热门 | completed | 10 | 6 | 正常 |
| 少数派首页 | completed | 10 | 0 | 正常，无新内容 |
| 知乎热榜 | completed | 30 | 17 | 正常 |
| readhub早报 | timeout | - | - | 15 秒超时 |
| infoQ | timeout | - | - | 15 秒超时 |
| 极客公园 | timeout | - | - | RSSHub 上游同时存在 403/503 |
| github 趋势 | timeout | - | - | 本轮超时，之前轮次有成功记录 |
| 36氪热榜 | completed | 20 | 0 | 上海时间 08:00 正常完成 |

最近 9 小时内的主要错误计数：

- Block Beats RSSHub 503：5 次。
- Hacker News 15 秒调度超时：5 次。
- Hacker News 底层请求超时或 503：5 次。
- 极客公园 RSSHub 503：5 次。
- 极客公园 15 秒调度超时：4 次。
- readhub早报 15 秒调度超时：4 次。
- infoQ 15 秒调度超时：4 次。
- github 趋势 15 秒调度超时：3 次。

## 数据新鲜度

下表是 `contents` 表中最后一条通过完整过滤并保存的内容时间，不等同于最后一次采集时间。没有新内容或内容全部被过滤时，该时间不会更新。

| 数据源 | 最后入选内容（上海时间） | 最近 24 小时入选数 |
| --- | --- | ---: |
| 36氪热榜 | 2026-08-22 00:01 | 73 |
| Block Beats | 2026-02-24 00:00 | 0 |
| Hacker News | 2026-01-27 22:00 | 0 |
| V2EX 热门 | 2026-08-22 10:00 | 9 |
| github 趋势 | 2026-08-22 08:00 | 6 |
| infoQ | 2026-08-21 20:01 | 11 |
| readhub早报 | 2026-08-21 06:01 | 0 |
| 少数派首页 | 2026-08-21 20:01 | 2 |
| 极客公园 | 从未入选 | 0 |
| 知乎热榜 | 2026-08-22 10:00 | 45 |

Block Beats、Hacker News 和极客公园的日志异常与数据长期不更新能够互相印证，应视为真实故障，而不是单纯没有新内容。

## 队列与任务历史

检查时 BullMQ 队列状态：

- waiting：0
- active：0
- failed：0
- delayed：0

任务历史统计：

- 总记录：25014
- 状态为 completed：25014
- 状态为 failed：0
- `success=true`：8070
- 平均耗时：8430ms

最近 100 条记录中，30 条 `success=true`，70 条 `success=false`。这里的 `success=false` 大部分表示内容被过滤管道拒绝，并不等同于 BullMQ 任务执行失败。

监控 API 返回 `workers.total=0` 也不代表 Worker 容器不存在。当前实现使用 active job 数量估算 Worker 数，队列空闲时必然显示为 0。

## 关键问题分析

### P0：数据源健康状态不可用

数据库中 14 条 source 记录的 `last_fetched_at` 全部为 `NULL`。代码只在 Worker 启动时同步名称、配置、启用状态和周期，没有在采集成功后写回最后采集时间。

直接影响：

- `/api/v1/sources/health` 显示 13 个启用源全部为 `error`。
- `lastCollectedAt` 和 `nextFetchAt` 无法计算。
- 前端无法区分成功、延迟、失败和从未运行。

建议将单个时间字段扩展为更明确的运行状态：

- `last_attempted_at`
- `last_succeeded_at`
- `last_fetch_status`
- `last_fetch_error`
- 可选的 `last_item_count`、`last_new_count` 和 `last_duration_ms`

### P0：配置与数据库源列表漂移

数据库显示 13 个启用源，但 Worker 实际只调度当前配置中的 10 个启用源。

以下旧记录已不在当前 `config.sources.ts` 中，却仍保持 enabled：

- 月球背面
- 一觉醒来发生了什么 - 即刻圈子
- 澎湃首页

当前 `syncSources()` 只 upsert 配置中存在的记录，不处理已从配置删除的记录。需要明确 source of truth：

1. 如果代码配置是唯一真源，启动同步时应禁用不再存在的数据库记录。
2. 如果数据库允许独立维护数据源，监控统计和调度器都应从数据库读取，不能继续双轨运行。

当前架构更接近第一种，建议由代码配置作为唯一真源。

### P0：采集失败被记录为成功完成

`CollectorManager.collectSource()` 捕获插件异常后返回空数组。`SourceScheduler.collectOne()` 无法区分“正常返回 0 条”和“采集失败”，因此会继续记录：

```text
Collection completed count=0
```

Block Beats 当前就是这种情况：RSSHub 返回 503，但调度器最终记录 completed。

建议让 Collector 抛出带 source 和错误类型的结构化异常，由 Scheduler 统一记录失败和更新数据库状态。

### P1：整点请求突发

所有 2 小时源都会变成 `0 */2 * * *`，所有 4 小时源会变成 `0 */4 * * *`。在双数整点，10 个任务几乎同时启动，其中多数会并发请求同一个 RSSHub 容器。

最近两轮多源同时在 15 秒边界超时，与这种集中调度高度吻合。

建议：

- 为每个 source 生成稳定且不同的分钟偏移。
- 或改用按间隔计算的 repeatable job，并加入稳定 jitter。
- 限制 RSSHub 路由并发数，避免单个上游慢请求拖累全部源。
- 36氪也应避开 2 小时源所在分钟。

### P1：超时没有真正取消底层请求

Scheduler 使用 `Promise.race()` 实现 15 秒超时，但没有取消 Collector 内仍在执行的 HTTP 请求。

日志中可以看到：

1. Scheduler 在 15 秒记录 Hacker News timeout 并释放锁。
2. 底层请求继续运行。
3. 约 30 秒时 Collector 再记录一次请求超时。

建议：

- 将 `AbortSignal` 从 Scheduler 传递到 Collector plugin。
- 超时时主动 abort HTTP 请求。
- 根据 RSSHub 路由实际响应时间，将超时配置为每源可调。
- 不要在请求仍执行时提前释放同一 source 的锁。

### P1：三个长期异常源

#### Block Beats

RSSHub `/theblockbeats/newsflash` 路由持续返回 503，内部错误为读取上游响应字段失败。可能是 RSSHub 镜像内路由实现已落后于上游接口。

建议先检查新版 RSSHub 路由；无法短期恢复时先禁用，避免每两小时制造无效错误。

#### Hacker News

主要错误包括连接超时、TLS 建连失败，以及一次证书域名被识别为 Facebook 域名。

证书错配不属于正常上游故障，应优先检查 RSSHub 容器使用的 HTTP(S) proxy、代理 DNS 和出口规则。

#### 极客公园

RSSHub 上游请求持续返回 403。仓库已有 2026-01-12 的历史排障记录，但当前配置重新启用了该源，实际仍未恢复。

建议在找到可用路由、请求头策略或替代 RSS 前保持禁用。

### P1：系统总览状态过于乐观

`systemStatus` 目前只根据 BullMQ waiting 和 failed 数量判断。它不会考虑：

- 数据源健康状态
- Worker 是否在线
- 最近一次成功采集时间
- RSSHub 路由错误率
- PostgreSQL/Redis 的真实探测结果

因此出现了“13 个启用源全部 error，但系统 healthy”的矛盾状态。

### P2：Worker 缺少 healthcheck

Worker 容器没有 Compose healthcheck。当前只能通过进程存活、日志和最近 job history 间接判断。

建议增加 Redis heartbeat 或独立健康状态记录，并由 API/Compose 读取，避免只检查 Node 主进程是否存在。

### P2：监控指标仍有占位实现

以下监控字段目前不应作为运行判断依据：

- AI filter/extract 调用次数及成功率固定为 0。
- 数据库状态固定返回 connected。
- API request count、平均响应时间和错误率固定为 0。
- Worker 数量使用 active job 数估算。

## 代码与运行镜像漂移

检查开始时的 Git 状态：

- 当前分支：`master`
- 相对 `origin/master`：ahead 1
- 已修改文件：44
- 未跟踪项：14
- 已跟踪 diff：约 961 行新增、580 行删除

运行镜像构建时间：

- Worker：约 9 小时前
- API：约 25 小时前
- Web：约 42 小时前

这意味着三个应用容器可能来自不同代码快照，当前工作区也不等同于任一完整运行快照。重新 build 或 `docker compose up -d --build` 前，应先确认哪些未提交改动已经进入各镜像。

## 资源状态

检查时容器内存使用大致如下：

- Web：约 5MiB
- API：约 67MiB
- Worker：约 55MiB
- PostgreSQL：约 164MiB
- Redis：约 9MiB
- RSSHub：约 266MiB

未发现明显内存压力。

Docker 全局存储占用偏大：

- Images：约 130.7GB，可回收约 65.8GB。
- Build cache：约 128.9GB，可回收约 70.5GB。
- IntelliPick PostgreSQL volume：约 361.8MB。
- IntelliPick Redis volume：约 25.9MB。

清理属于全局性操作，可能影响其他项目的构建缓存。本次没有执行清理。

## 建议修复顺序

### 第一阶段：恢复监控真实性

1. 为 source 增加明确的采集状态字段和 migration。
2. 采集开始、成功、失败、超时时更新对应状态。
3. Collector 不再吞掉异常。
4. 同步配置时禁用已移除的旧 source。
5. 系统总览纳入 source、Worker、数据库和 Redis 的真实状态。

### 第二阶段：提高采集可靠性

1. 为数据源错开调度分钟。
2. 使用 `AbortSignal` 真正取消超时请求。
3. 为 RSSHub 增加合理的并发限制。
4. 分别修复或暂时禁用 Block Beats、Hacker News、极客公园。
5. 增加 Worker heartbeat 或 healthcheck。

### 第三阶段：完善运维入口

1. 增加可通过公网代理访问的 API health 路由。
2. 将 AI、API、数据库和 Redis 的占位指标替换为真实探测。
3. 盘点未提交改动和当前镜像对应关系。
4. 在确认不影响其他项目后清理 Docker 无用镜像和 build cache。

## 预计涉及文件

- `config.sources.ts`
- `apps/worker/src/scheduler/cron-converter.ts`
- `apps/worker/src/scheduler/source-scheduler.ts`
- `apps/worker/src/collector/manager.ts`
- `apps/worker/src/collector/plugins/rss.ts`
- `apps/worker/src/lib/sources.ts`
- `packages/db/src/schema/sources.ts`
- `packages/db/drizzle/`
- `apps/api/src/services/sources.service.ts`
- `apps/api/src/services/monitoring.service.ts`
- `apps/api/src/services/queue.service.ts`
- `apps/web/nginx.conf`
- `docker-compose.yml`

## 修复后验证清单

- Compose 配置校验通过。
- Worker 重启后只有当前配置中的启用源参与调度。
- 不同数据源的执行分钟已错开。
- 采集成功后 `last_succeeded_at` 正确更新。
- 采集失败后状态和错误原因可通过 API 查询。
- 超时后底层 HTTP 请求被真正取消。
- Block Beats、Hacker News、极客公园能够明确显示为正常、禁用或故障，而不是 completed 0。
- `/api/v1/sources/health` 与 Worker 日志、数据库状态一致。
- 队列空闲时仍能正确显示 Worker 在线。
- 公网 API health 路由返回 API JSON，而不是 SPA HTML 或 404。
- 本地与公网链路都完成端到端验证。

## 常用只读检查命令

```bash
docker compose ps --all
docker compose --env-file .env.production config --quiet
docker compose logs --since 2h intellipick-worker
docker compose logs --since 2h intellipick-rsshub
curl --silent --show-error http://127.0.0.1:8085/health
curl --silent --show-error http://127.0.0.1:8085/api/v1/monitoring
launchctl print system/com.frpc
```

公网入口带有认证。验证时应从现有安全配置读取凭据，不要把用户名或密码写入文档、命令历史或脚本。

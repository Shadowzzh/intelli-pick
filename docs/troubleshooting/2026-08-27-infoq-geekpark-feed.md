# InfoQ 与极客公园数据源连通性排查

## 现象

Sift 数据源健康页显示 InfoQ 与极客公园采集失败，错误为：

```text
Collection timeout after 15s
```

正式环境为 NAS：`/home/ziheng/intellipick`。

## InfoQ 根因

原配置使用：

```text
http://intellipick-rsshub:1200/infoq/recommend
```

RSSHub 路由先请求推荐列表，再逐篇获取完整正文。NAS 日志显示路由最终返回 HTTP 200，但冷缓存耗时约 18–19 秒。Sift 外层调度器只等待 15 秒，因此在 RSSHub 成功前记录了超时。

InfoQ 官方 `https://www.infoq.cn/feed` 实测约 262ms，但 `rss-parser` 得到的正文只有约 7 个字符，主要是“查看原文”，不适合直接用于 AI 内容筛选。官方链接还包含 UTM 参数，直接替换会与现有无参数 URL 产生重复。

最终继续使用 RSSHub，并通过通用 `limit` 参数限制完整正文数量：

```text
http://intellipick-rsshub:1200/infoq/recommend?limit=10
```

## 极客公园根因

原 RSSHub `/geekpark` 路由已经成功调用 `mainssl.geekpark.net` API 并补全文章，最后为了生成 Feed 的站点标题又访问：

```text
https://geekpark.net/
```

该首页通过 mini 代理和绕过显式代理时均返回 HTTP 403，导致整个 RSSHub 路由最终返回 503。

极客公园官方 RSS：

```text
https://www.geekpark.net/rss
```

在正式 Worker 容器中实测：

- HTTP 200
- 30 条内容
- 约 3.1 秒完成
- 第一篇正文约 2,477 字符
- `rss-parser` 解析成功

最终改用官方 RSS，不再经过 RSSHub 首页路由。

## DNS 与代理

NAS 使用 Mihomo fake-IP，两个源站解析到 `198.18.0.0/16` 属于当前代理架构的正常表现。

RSSHub 容器存在指向 mini 的小写代理变量，实际地址以 NAS 当前容器环境变量为准。极客公园首页在显式代理和绕过显式代理时均为 403，因此本次故障不通过修改全局代理解决。

## 最终配置

InfoQ：

```ts
{
  name: "infoQ",
  type: "rss",
  enabled: true,
  fetchInterval: 2 * 60 * 60,
  scheduleMinute: 5,
  config: {
    url: createRssHubUrl("infoq/recommend?limit=10"),
    useProxy: false,
  },
}
```

极客公园：

```ts
{
  name: "极客公园",
  type: "rss",
  enabled: true,
  fetchInterval: 2 * 60 * 60,
  scheduleMinute: 10,
  config: {
    url: "https://www.geekpark.net/rss",
    useProxy: false,
  },
}
```

Linux.do 热门保持第 15 分钟执行。三个外部源依次错开，避免与整点 RSSHub 批量任务竞争资源。

## 超时调整

RSS 插件单次请求超时为 30 秒。调度器外层原来只等待 15 秒，会误判仍在执行的请求。

外层超时已调整为 35 秒：

```text
COLLECTION_TIMEOUT_MS = 35 * 1000
```

这样插件会先在 30 秒内完成或失败，调度器再负责最终兜底。

## 部署与回滚

部署前源码备份：

```text
/home/ziheng/intellipick/.codex-backups/20260827-011500-feed-connectivity-source.tar.gz
```

回滚镜像：

```text
intellipick-worker:rollback-feed-connectivity-20260827-011500
```

本轮验证日志：

```text
~/.codex/user-output/2026-08-27/intellipick-feed-connectivity-日志/
```

正式调度时间：

- InfoQ：每个双数小时的 05 分
- 极客公园：每个双数小时的 10 分

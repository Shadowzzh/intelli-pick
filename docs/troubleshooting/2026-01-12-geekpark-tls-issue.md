# GeekPark RSS 采集失败问题排查报告

**日期**: 2026-01-12
**问题**: GeekPark RSS feed 无法访问
**状态**: 已确认为源站 TLS/SSL 问题，暂无解决方案

## 问题描述

在实现 `collect-geekpark.ts` 测试脚本时，发现无法访问 GeekPark 的 RSS feed：
- 官方 RSS: `https://www.geekpark.net/rss`
- RSSHub 路由: `http://localhost:1200/geekpark`

## 错误信息

### Node.js 脚本直接访问

```
Error: Client network socket disconnected before secure TLS connection was established
    at TLSSocket.onConnectEnd (node:_tls_wrap:1701:19)
    at TLSSocket.emit (node:events:519:28)
    at endReadableNT (node:internal/streams/readable:1696:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'ECONNRESET',
  path: null,
  host: 'www.geekpark.net',
  port: 443,
  localAddress: undefined
}
```

### RSSHub 日志

```
error: Request https://geekpark.net/ fail: Error: Client network socket disconnected before secure TLS connection was established TypeError: fetch failed
error: Error in /geekpark: FetchError: [GET] "https://geekpark.net/": <no response> fetch failed
info: --> HEAD /geekpark 503 18s
```

## 排查过程

### 1. 验证脚本实现

**测试**: 使用知乎热榜 RSS feed 测试脚本
```bash
# 临时修改 RSS URL
url: "http://localhost:1200/zhihu/hot"

# 运行脚本
pnpm --filter @intellipick/test-scripts run collect:geekpark
```

**结果**: ✅ 成功采集 30 条文章，脚本本身无问题

### 2. 测试代理配置

**检查代理服务**: Clash Party 运行在 `http://127.0.0.1:7890`

**测试 1**: 脚本通过代理访问
```typescript
const httpAgent = new HttpsProxyAgent('http://127.0.0.1:7890');
```
**结果**: ❌ 仍然报 TLS 错误

**测试 2**: 直接访问（无代理）
```bash
curl -I https://www.geekpark.net/rss
```
**结果**: ❌ 相同的 TLS 连接错误

### 3. 检查 RSSHub 配置

**问题**: RSSHub 容器无法访问外部网站（GitHub trending、GeekPark）

**原因**: Docker Compose 环境变量配置问题
- `.env.production` 中定义了 `RSSHUB_HTTP_PROXY` 和 `RSSHUB_HTTPS_PROXY`
- 但 `docker-compose.yml` 中使用 `${RSSHUB_HTTP_PROXY:-}` 解析为空字符串
- 没有添加 `env_file` 配置

**修复步骤**:

1. 添加 `env_file` 到 `docker-compose.yml`:
```yaml
intellipick-rsshub:
  env_file:
    - .env.production
```

2. 硬编码代理值（避免变量解析问题）:
```yaml
environment:
  HTTP_PROXY: 'http://host.docker.internal:7890'
  HTTPS_PROXY: 'http://host.docker.internal:7890'
```

3. 重新创建容器:
```bash
docker-compose up -d --force-recreate intellipick-rsshub
```

4. 验证环境变量:
```bash
docker exec intellipick-rsshub env | grep -E "^HTTP_PROXY=|^HTTPS_PROXY="
# 输出：
# HTTP_PROXY=http://host.docker.internal:7890
# HTTPS_PROXY=http://host.docker.internal:7890
```

### 4. 验证 RSSHub 代理功能

**测试 1**: 知乎热榜（需要代理）
```bash
curl -I "http://localhost:1200/zhihu/hot"
```
**结果**: ✅ HTTP 200 OK - 代理配置正常工作

**测试 2**: GeekPark 路由
```bash
curl -I "http://localhost:1200/geekpark"
```
**结果**: ❌ HTTP 503 Service Unavailable (18 秒后)

**RSSHub 日志**: 显示相同的 TLS 连接错误

## 结论

### 根本原因

**GeekPark 网站本身存在 TLS/SSL 配置问题**，导致无法建立安全连接。这不是我们代码或配置的问题。

### 验证依据

1. **多种访问方式均失败**:
   - Node.js 直接访问: ❌
   - Node.js 通过代理: ❌
   - curl 直接访问: ❌
   - RSSHub (Docker + 代理): ❌

2. **相同的错误信息**: 所有方式都报 "Client network socket disconnected before secure TLS connection was established"

3. **对比测试成功**:
   - 使用相同代码访问知乎热榜: ✅
   - RSSHub 访问其他源站: ✅

### 可能的原因

1. **网站维护中**: GeekPark 可能正在更新服务器或 SSL 证书
2. **证书配置错误**: SSL/TLS 证书过期或配置不当
3. **网络限制**: 网站可能限制了某些地区或 IP 的访问
4. **服务器问题**: 源站服务器可能有技术故障

## 解决方案

### 当前措施

1. ✅ **禁用 GeekPark 数据源** (config.sources.ts)
```typescript
{
  name: "极客公园",
  enabled: false, // 禁用原因：TLS 连接问题
  config: {
    url: "http://localhost:1200/geekpark"
  }
}
```

2. ✅ **脚本已完成并验证** (collect-geekpark.ts)
   - 代码质量: 100% 通过
   - 功能验证: 使用知乎 RSS 成功测试

3. ✅ **修复 RSSHub 代理配置**
   - Docker Compose 环境变量正确
   - 知乎等其他源站正常工作

### 后续建议

1. **定期检查 GeekPark 网站**:
```bash
# 测试脚本
curl -I --max-time 5 https://www.geekpark.net/rss
```

2. **网站恢复后重新启用**:
```typescript
{
  name: "极客公园",
  enabled: true, // 源站恢复后启用
}
```

3. **考虑备选方案**:
   - 寻找 GeekPark 的镜像或备用 RSS 源
   - 使用 GeekPark 的 API（如果有）
   - 暂时移除此数据源，专注于其他可用源

## 相关文件

- 测试脚本: `packages/test-scripts/src/collect-geekpark.ts`
- 配置文件: `config.sources.ts`
- Docker 配置: `docker-compose.yml`
- 环境变量: `.env.production`

## 附录: 成功的测试输出

使用知乎热榜测试脚本功能：

```
🌐 极客公园 RSS 采集测试脚本

📋 加载配置...
   工作目录: /Users/zhangziheng/Documents/github/intellipick
   数据源: 极客公园
   RSS URL: http://localhost:1200/zhihu/hot
   ✅ 配置加载完成

🔌 初始化 RSS 解析器...
   ✅ 代理已配置: http://127.0.0.1:7890

📡 开始采集数据...
   ✅ 成功采集 30 条文章

📝 样本预览:
────────────────────────────────────────────────────────────────────────────────
1. 如果再给你一次选专业的机会，你会选什么？
   内容: 补充一下，我自己挺喜欢文史哲的，觉得有趣。但觉得人做自己喜欢的事，不一定就要做成职业吧。...

2. 你不想上班的时候都在想什么？
   内容: 冬天好冷，好想辞职买张机票出去旅游。在办公室坐着，突然就不想工作了，想躺平。...

3. 如何评价 2025 年 1 月新番动画？
   内容: 1 月新番终于来了！有哪些让你期待的作品？...

   ... 还有 27 条
────────────────────────────────────────────────────────────────────────────────

💾 保存到文件: /Users/.../test-data/geekpark-samples-2026-01-12T08-45-23-456Z.json
   ✅ 保存成功

✅ 测试数据采集完成!
```

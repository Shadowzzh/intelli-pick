# Docker 网络与代理配置详解

## 📚 目录
1. [Docker 网络基础](#docker-网络基础)
2. [容器访问宿主机服务](#容器访问宿主机服务)
3. [代理配置完整流程](#代理配置完整流程)
4. [项目中的具体实现](#项目中的具体实现)

---

## Docker 网络基础

### 默认网络模式

Docker 容器默认运行在 **bridge 网络模式**下，容器拥有自己独立的网络栈：

```
┌─────────────────────────────────────┐
│         宿主机 (Host)                │
│  ┌───────────────────────────────┐  │
│  │  Docker Bridge 网络           │  │
│  │  ┌─────────┐  ┌─────────┐    │  │
│  │  │ 容器 A   │  │ 容器 B   │    │  │
│  │  │ 172.17.0.2│  │172.17.0.3│    │  │
│  │  └─────────┘  └─────────┘    │  │
│  │                               │  │
│  │  docker0: 172.17.0.1         │  │
│  └───────────────────────────────┘  │
│                                     │
│  eth0: 192.168.1.100 (物理网卡)     │
└─────────────────────────────────────┘
```

### 关键点

1. **容器内部**：`127.0.0.1` 指向容器自己，不是宿主机
2. **容器间通信**：通过 Docker 内部 DNS 使用服务名
3. **访问外网**：容器通过 NAT 方式访问，流量经过宿主机的网络接口

---

## 容器访问宿主机服务

### 问题
容器内无法直接通过 `127.0.0.1` 或 `localhost` 访问宿主机上运行的服务。

### 解决方案对比

| 方法 | 平台支持 | 配置方式 | 示例 |
|------|---------|---------|------|
| **host.docker.internal** | macOS, Windows | 自动支持 | `http://host.docker.internal:7890` |
| **host-gateway** | Linux | extra_hosts | `host.docker.internal:host-gateway` |
| **--network host** | 全平台 | 网络模式 | 容器直接使用宿主机网络栈 |
| **宿主机 IP** | 全平台 | 手动配置 | `http://192.168.1.100:7890` |

### 我们的选择：`host.docker.internal`

#### macOS/Windows（Docker Desktop）
Docker Desktop 内置了 DNS 解析：
```yaml
# docker-compose.yml
services:
  app:
    # 不需要配置，直接可用
    environment:
      - HTTP_PROXY=http://host.docker.internal:7890
```

#### Linux（需要手动配置）
```yaml
# docker-compose.yml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - HTTP_PROXY=http://host.docker.internal:7890
```

**`host-gateway` 说明**：
- Docker 内置的特殊网关地址
- 自动解析为宿主机的网关 IP
- 通常在 `172.17.0.1` 或类似地址

---

## 代理配置完整流程

### 1️⃣ 环境变量传递

```
┌─────────────────────────────────────────────────────────┐
│  .env.production (宿主机)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ HTTP_PROXY=http://host.docker.internal:7890    │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         │ env_file                      │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  docker-compose.yml                             │   │
│  │  services:                                      │   │
│  │    intellipick-app:                             │   │
│  │      env_file: .env.production  ◄───────────────┼───┘
│  │      extra_hosts:                               │
│  │        - "host.docker.internal:host-gateway"     │
│  └─────────────────────────────────────────────────┘
│                         │
│                         │ 容器启动时注入环境变量
│                         ▼
│  ┌─────────────────────────────────────────────────┐
│  │  容器内部环境变量                                │
│  │  HTTP_PROXY=http://host.docker.internal:7890    │
│  └─────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ DNS 解析过程

```
容器发起请求: http://host.docker.internal:7890
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Docker 内部 DNS 解析                                    │
│                                                         │
│  查询: host.docker.internal                             │
│    │                                                     │
│    ├─► macOS/Windows: Docker Desktop 内置 DNS          │
│    │      返回: 宿主机实际 IP (如 192.168.65.1)         │
│    │                                                     │
│    └─► Linux: extra_hosts 映射                         │
│           返回: host-gateway IP (如 172.17.0.1)         │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
              连接到宿主机 7890 端口
```

### 3️⃣ HTTP 代理工作原理

```
┌──────────────────────────────────────────────────────────┐
│  容器内应用                                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  代码: fetch('https://api.example.com/data')       │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
│                          │ undici 自动检测 HTTP_PROXY     │
│                          ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ProxyAgent (undici)                               │  │
│  │  - 拦截所有 HTTP/HTTPS 请求                        │  │
│  │  - 转发到代理服务器                                │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
│                          ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  建立隧道: CONNECT host.docker.internal:7890      │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
│                          ▼                                │
┌──────────────────────────────────────────────────────────┐
│  宿主机代理服务 (127.0.0.1:7890)                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  代理服务器 (如 Clash, v2ray)                       │  │
│  │  - 接收容器请求                                     │  │
│  │  - 转发到实际目标                                   │  │
│  │  - 返回响应给容器                                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
                   实际目标服务器
              (https://api.example.com)
```

---

## 项目中的具体实现

### 配置流程

#### 第一步：环境变量定义

**`.env.production`**:
```env
# Docker 容器访问宿主机代理
HTTP_PROXY=http://host.docker.internal:7890
```

#### 第二步：Docker 配置

**`docker-compose.yml`**:
```yaml
services:
  intellipick-app:
    env_file:
      - .env.production              # 加载环境变量
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Linux 需要
    networks:
      - intellipick-network
```

#### 第三步：Config 包自动处理

**`packages/config/src/index.ts`**:
```typescript
export function defineConfig(config: Config): Config {
    const mergedConfig = {
        ...config,
        network: {
            ...config.network,
            // 自动从环境变量读取
            httpProxy: process.env.HTTP_PROXY || config.network?.httpProxy,
        },
    };
    return ConfigSchema.parse(mergedConfig);
}
```

#### 第四步：代理初始化

**`apps/api/src/lib/proxy.ts`**:
```typescript
import { ProxyAgent } from "undici";
import { HttpsProxyAgent } from "https-proxy-agent";

export function initializeProxy(config: Config) {
    const proxyUrl = config.network?.httpProxy;

    if (proxyUrl) {
        // undici 的代理 (Node.js 18+ 内置)
        proxyAgent = new ProxyAgent(proxyUrl);

        // Node.js 原生 http/https 模块的代理
        nodeProxyAgent = new HttpsProxyAgent(proxyUrl);

        console.log("🔧 Proxy config:", { proxyUrl, hasDispatcher: true });
    }
}
```

#### 第五步：应用启动时初始化

**`apps/api/src/index.ts`**:
```typescript
import { initializeProxy } from "./lib/proxy.js";

async function main() {
    // 加载配置
    const config = await loadConfig();

    // 初始化代理
    initializeProxy(config);

    // ... 后续代码
}
```

#### 第六步：实际使用

**方式一：使用 undici (自动)**:
```typescript
import { request } from "undici";

// undici 会自动使用 ProxyAgent (通过 globalDispatcher)
const { body } = await request("https://api.example.com/data");
```

**方式二：使用 fetch (Node.js 18+)**:
```typescript
// Node.js 18+ 的 fetch 基于 undici，自动支持代理
const response = await fetch("https://api.example.com/data");
```

**方式三：使用 https-proxy-agent**:
```typescript
import { request } from "https";
import { getNodeProxyAgent } from "./lib/proxy.js";

const agent = getNodeProxyAgent();
const req = request({
    hostname: "api.example.com",
    agent: agent,  // 使用代理
    // ...
});
```

### 数据流示意

```
配置文件 (.env.production)
    │
    │ env_file
    ▼
Docker Compose
    │
    │ 环境变量注入
    ▼
容器环境变量 (process.env.HTTP_PROXY)
    │
    │ defineConfig 读取
    ▼
Config 对象 (config.network.httpProxy)
    │
    │ initializeProxy
    ▼
ProxyAgent 实例化
    │
    │ 设置为全局 dispatcher
    ▼
所有 HTTP 请求自动走代理
    │
    │ DNS 解析 host.docker.internal
    ▼
宿主机代理服务器 (7890)
    │
    │ 转发请求
    ▼
实际目标服务器
```

---

## 验证代理配置

### 1. 检查环境变量

```bash
docker compose exec intellipick-app env | grep HTTP_PROXY
# 输出: HTTP_PROXY=http://host.docker.internal:7890
```

### 2. 检查 DNS 解析

```bash
docker compose exec intellipick-app nslookup host.docker.internal
# 输出: Server:  127.0.0.11
#      Address: 127.0.0.11:53
#      Name:    host.docker.internal
#      Address: 192.168.65.1  (macOS)
#      或
#      Address: 172.17.0.1   (Linux)
```

### 3. 检查代理连接

```bash
docker compose exec intellipick-app sh -c 'curl -v http://host.docker.internal:7890'
# 输出: Connected to host.docker.internal (...) port 7890
```

### 4. 检查实际外网请求

```bash
docker compose logs intellipick-app | grep "Proxy config"
# 输出: 🔧 Proxy config: { proxyUrl: 'http://host.docker.internal:7890', hasDispatcher: true }
```

---

## 常见问题

### Q1: 为什么不直接使用 `--network host`？

**A**: `--network host` 会：
- 让容器直接使用宿主机网络栈
- 失去容器网络隔离
- 端口管理变得复杂
- 不适合生产环境

### Q2: Linux 上为什么需要 `extra_hosts`？

**A**: Linux 版 Docker 没有 Docker Desktop 的内置 DNS，需要手动映射。

### Q3: 如何验证代理是否生效？

**A**: 查看日志中的代理配置信息：
```
🔧 Proxy config: { proxyUrl: 'http://host.docker.internal:7890', hasDispatcher: true }
```

如果 `hasDispatcher: false`，说明代理未配置。

### Q4: 容器如何知道使用代理？

**A**: 通过环境变量 `HTTP_PROXY` 和 `HTTPS_PROXY`：
- `undici` (Node.js 18+ 内置) 自动读取
- 我们的代码通过 `ProxyAgent` 显式设置
- 兼容 `fetch`、`request` 等多种 HTTP 客户端

---

## 技术栈总结

| 组件 | 用途 | 项目中的使用 |
|------|------|-------------|
| **host.docker.internal** | 宿主机 DNS 解析 | 容器访问宿主机代理 |
| **extra_hosts** | Linux 兼容性 | 映射 host-gateway |
| **HTTP_PROXY** | 环境变量 | 传递代理地址 |
| **ProxyAgent (undici)** | HTTP 代理 | Node.js 18+ fetch |
| **HttpsProxyAgent** | HTTPS 代理 | Node.js 原生模块 |
| **defineConfig** | 配置管理 | 自动读取环境变量 |

---

## 参考资源

- [Docker Networking: host-gateway](https://docs.docker.com/network/drivers/bridge/#use-the-host-gateway-to-access-the-host)
- [Docker Desktop: host.docker.internal](https://docs.docker.com/desktop/networking/#use-host-gateway-in-container-networking)
- [undici ProxyAgent](https://undici.nodejs.org/#/docs/api/ProxyAgent)
- [https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent)

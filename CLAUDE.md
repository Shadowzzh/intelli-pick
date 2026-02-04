# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

使用中文回复。

## 项目概述

IntelliPick（智选）是一个基于 AI 的智能内容筛选和价值提取系统。它从多个来源（RSS、Twitter、V2EX 等）采集内容，通过 AI 进行质量过滤和实体提取，最终将有价值的内容存储到数据库中。

## 技术栈

- **包管理**: pnpm 9 workspace (monorepo)
- **构建工具**: Turbo 2
- **运行时**: Node.js 18+
- **语言**: TypeScript 5.7
- **数据库**: PostgreSQL 16 + Drizzle ORM
- **队列**: BullMQ + Redis 7
- **AI SDK**: Vercel AI SDK 4 (支持 DeepSeek、Anthropic 等)
- **代码风格**: Biome 1
- **前端**: React 18 + Vite 6 + Tailwind CSS 4
- **WebSocket**: Socket.IO (实时推送新内容)
- **时区处理**: 所有时间使用 `timestamp with time zone` 存储为 UTC

## 常用命令

### 开发
```bash
pnpm dev                 # 开发模式运行所有包
pnpm build              # 构建所有包
pnpm typecheck          # 类型检查
```

### 代码质量
```bash
pnpm lint               # 检查代码风格
pnpm lint:fix           # 自动修复代码风格问题
pnpm format             # 格式化代码
```

### 数据库
```bash
pnpm db:generate        # 根据 schema 生成迁移文件
pnpm db:migrate         # 运行迁移
pnpm db:push            # 直接推送 schema 到数据库（开发用）
pnpm db:studio          # 打开 Drizzle Studio
```

### Redis
```bash
pnpm redis:status       # 查看 Redis 和队列状态
```

### API 应用
```bash
cd apps/api
pnpm dev                # 开发模式运行 API
pnpm build              # 构建 API
pnpm start              # 运行构建后的 API
```

### Worker 应用（后台处理）
```bash
cd apps/worker
pnpm dev                # 开发模式运行 Worker
pnpm build              # 构建 Worker
pnpm start              # 运行构建后的 Worker
```

### Web 应用（前端）
```bash
cd apps/web
pnpm dev                # 开发模式运行 Web 应用
pnpm build              # 构建 Web 应用
pnpm preview            # 预览构建后的应用
```

### Docker
```bash
docker-compose up -d    # 启动所有服务（API、Worker、PostgreSQL、Redis、RSSHub）
docker-compose logs -f  # 查看日志
docker-compose down     # 停止所有服务
```

## 架构概览

### Monorepo 结构

```
apps/
  api/                  # HTTP API 服务器 (Fastify + GraphQL Yoga + Socket.IO)
  worker/               # 后台处理系统 (Collector + Pipeline + Scheduler)
  web/                  # React 前端应用 (Vite + React Router + TanStack Query)
packages/
  config/               # 配置加载和验证 (jiti + zod)
  db/                   # 数据库 schema 和客户端 (Drizzle ORM)
  env/                  # 环境变量验证 (@t3-oss/env-core)
  events/               # Worker-API 事件通信 (EventEmitter)
  shared/               # 共享类型定义和工具函数
docs/                   # 项目文档（API 文档、设计文档等）
```

### 核心工作流程

1. **采集 (Collector)**: `apps/worker/src/collector/`
   - 插件化架构，每个数据源类型对应一个插件
   - CollectorManager 管理所有插件
   - 支持的插件: RSS、Twitter、V2EX
   - 采集到的原始内容 (RawContent) 发送到 BullMQ 队列

2. **处理管道 (Pipeline)**: `apps/worker/src/pipeline/`
   - 顺序执行的步骤链，每个步骤可以过滤或增强内容
   - 步骤顺序:
     1. `DedupStep` - 去重检查
     2. `HardFilterStep` - 硬规则过滤（黑名单域名、垃圾关键词）
     3. `AiFilterStep` - AI 质量评分和安全检查
     4. `AiExtractStep` - AI 实体提取和分类
     5. `StorageStep` - 存储到数据库或隔离区
   - 如果任何步骤返回 null，内容被过滤掉，管道终止

3. **队列处理 (Worker)**: `apps/worker/src/worker.ts`
   - BullMQ worker 从队列中取出 RawContent
   - 调用 Pipeline 处理每个内容
   - 并发度为 5

4. **调度器**: `apps/worker/src/scheduler/`
   - Cron 定时任务触发采集
   - 支持每个数据源独立的采集间隔
   - 启动时立即执行一次采集
   - 优雅关闭处理

### API 服务器

**位置**: `apps/api/src/`
- **Fastify** - RESTful API
- **GraphQL Yoga** - GraphQL 查询接口
- **Socket.IO** - WebSocket 实时推送新内容
- **事件系统**: Worker 通过 `@intellipick/events` 发送事件，API 广播到客户端
- **服务层**：
  - ContentsService - 内容管理
  - EntitiesService - 实体管理
  - SearchService - 全文搜索
  - SourcesService - 数据源管理
- **存储层**：
  - ContentsRepository - 内容仓库
  - EntitiesRepository - 实体仓库

### 数据库 Schema

位于 `packages/db/src/schema/`:
- `sources` - 数据源配置（从 config.ts 同步）
- `contents` - 通过过滤的内容
- `entities` - 提取的实体（人、组织、产品等）
- `entity-mentions` - 内容中提到的实体
- `tags` - 内容标签
- `quarantine` - 未通过过滤但未明确拒绝的内容（有 TTL）

### 配置系统

- **用户配置**: 根目录 `config.ts`
  - 使用 `defineConfig()` 定义配置
  - 包含 AI 提供商、数据源、过滤规则、网络代理等

- **环境变量**: `.env` (参考 `.env.example`)
  - DATABASE_URL - PostgreSQL 连接串
  - REDIS_URL - Redis 连接串
  - AI 提供商 API keys

### AI 集成

- 使用 Vercel AI SDK 统一接口
- 支持多个提供商（DeepSeek、Anthropic 等）
- 两个主要任务:
  - `filter` - 内容质量评分 (0-100) 和安全检查
  - `extractAndClassify` - 实体提取和内容分类
- 内容分类体系:
  - 一级分类: 技术、商业、产品、职场、资讯、生活、其他
  - 二级分类: AI 自由生成
  - 标签: 多维度标签
- AI 客户端创建: `apps/api/src/lib/ai.ts`

### 时区处理架构

**核心原则**: "Store in UTC, Display in Local" (存储为 UTC，显示为本地)

- **数据库**: 所有时间字段使用 `timestamp with time zone`，自动存储为 UTC
- **传输层**: 使用 ISO 8601 字符串 (如 `"2026-01-09T09:26:27.165Z"`)
- **应用层**: 使用 Date 对象进行日期计算和查询
- **显示层**: 前端将 UTC 时间转换为用户本地时区显示

详见 `docs/timezone-handling.md`

### 代理支持

- 通过 `config.network.httpProxy` 配置
- 使用 `undici` 的 ProxyAgent
- 在应用启动时初始化: `apps/api/src/lib/proxy.ts`

## 开发注意事项

### 添加新数据源

1. 在 `apps/worker/src/collector/plugins/` 创建新插件
2. 实现 `CollectorPlugin` 接口
3. 在 `apps/worker/src/collector/index.ts` 注册插件
4. 在 `packages/config/src/schema.ts` 添加配置 schema

### 添加新过滤步骤

1. 在 `apps/worker/src/pipeline/` 创建新步骤
2. 实现 `PipelineStep` 接口
3. 在 `apps/worker/src/pipeline/index.ts` 的 Pipeline 构造函数中插入到合适位置

### 修改数据库 Schema

1. 编辑 `packages/db/src/schema/` 中的文件
2. 运行 `pnpm db:generate` 生成迁移
3. 运行 `pnpm db:migrate` 应用迁移
4. 开发时可用 `pnpm db:push` 直接推送

### 处理时间数据

**采集层** (Worker):
```typescript
import { toUTCISOString } from "@intellipick/shared";

// 将 Date 对象转换为 UTC ISO 字符串
return {
  publishedAt: item.pubDate ? toUTCISOString(item.pubDate) : null,
  collectedAt: toUTCISOString(new Date()),
};
```

**API 层** (Repository):
```typescript
// 直接使用 Date 对象，PostgreSQL 自动处理时区转换
const results = await db
  .select()
  .from(contents)
  .where(gte(contents.publishedAt, new Date(filters.publishedAfter)));
```

**前端层**:
```typescript
// 发送 UTC ISO 字符串
fetch('/api/contents', {
  body: JSON.stringify({
    from: dateRange.from?.toISOString(), // "2026-01-09T09:26:27.165Z"
  })
});

// 显示时转换为本地时间
const displayTime = format(new Date(publishedAt), 'yyyy-MM-dd HH:mm:ss');
```

### 环境准备

需要运行的服务:
- PostgreSQL (默认 localhost:5432)
- Redis (默认 localhost:6379)

### 测试

```bash
# 运行所有测试
pnpm test

# 运行单个测试文件
pnpm test apps/api/src/__tests__/example.test.ts

# 监听模式
pnpm test:watch
```

## 项目文档

详细文档位于 `docs/` 目录：
- `api.md` - API 文档
- `websocket-usage.md` - WebSocket 使用文档
- `timezone-handling.md` - 时区处理架构重构文档
- `api-examples.md` - API 使用示例
- `design.md` - 系统设计文档
- `performance-evaluation.md` - 性能评估
- `queue-configuration-guide.md` - 队列配置指南
- `DOCKER_NETWORK_AND_PROXY.md` - Docker 网络和代理配置

## Docker 部署架构

**服务组成**:
- `intellipick-api` (端口 8085) - HTTP API 服务器
- `intellipick-worker` - 后台处理系统
- `intellipick-db` (PostgreSQL 16, 端口 15432) - 数据库
- `intellipick-redis` (Redis 7) - 缓存和队列
- `intellipick-rsshub` (端口 1200) - RSS 生成服务

**构建策略**: 本地编译 TypeScript，Docker 只复制产物
- 构建速度: ~30 秒
- 镜像体积: ~150MB

**网络**: 所有服务运行在 `intellipick-network` 桥接网络中

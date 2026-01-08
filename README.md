# IntelliPick / 智选

**AI 驱动的智能内容筛选与价值提取系统**

IntelliPick 从多个来源（RSS、Twitter、V2EX 等）采集内容，通过 AI 进行质量过滤和实体提取，为你精选有价值的信息。

## 核心特性

- **智能过滤**: 基于 AI 的内容质量评分，自动过滤噪声和低价值信息
- **实体提取**: 自动识别并提取人物、公司、产品、项目等关键实体
- **多源采集**: 支持 RSS、Twitter、V2EX 等多种数据源
- **安全检测**: 内置 NSFW、诈骗、骚扰等安全风险检测
- **可扩展**: 插件化架构，轻松添加新的数据源和处理步骤

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL
- Redis
- pnpm

### 安装

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的配置
```

### 配置

编辑根目录的 `config.ts`:

```typescript
export default defineConfig({
  ai: {
    providers: {
      deepseek: {
        baseUrl: "https://api.deepseek.com/v1",
      },
    },
    tasks: {
      filter: {
        provider: "deepseek",
        model: "deepseek-chat",
      },
      extractAndClassify: {
        provider: "deepseek",
        model: "deepseek-chat",
      },
    },
  },
  sources: [
    {
      name: "Hacker News",
      type: "rss",
      enabled: true,
      fetchInterval: 3600,
      config: {
        url: "https://hnrss.org/frontpage",
      },
    },
  ],
  // ...更多配置
});
```

### 运行

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 生产模式
pnpm start
```

## 架构

### Monorepo 结构

```
apps/
  api/                  # HTTP API 服务器（RESTful + GraphQL）
  worker/               # 后台处理系统（collector + worker + scheduler）
packages/
  config/              # 配置加载和验证
  db/                  # 数据库 schema 和客户端
  env/                 # 环境变量验证
  shared/              # 共享类型定义
```

### 核心流程

**Worker（后台处理）:**
1. **采集 (Collector)**: 从配置的数据源采集原始内容
2. **队列 (Queue)**: 使用 BullMQ 管理任务队列
3. **处理管道 (Pipeline)**:
   - 去重检查
   - 硬规则过滤
   - AI 质量评分
   - AI 实体提取
   - 存储到数据库
4. **调度 (Scheduler)**: 定时触发采集任务

**API（HTTP 服务）:**
- RESTful API - 标准的 HTTP 端点
- GraphQL API - 灵活的查询接口
- AI Chat - 自然语言查询接口

## 技术栈

- **运行时**: Node.js 18+ / TypeScript
- **包管理**: pnpm workspace (monorepo)
- **构建工具**: Turbo
- **数据库**: PostgreSQL (Drizzle ORM)
- **队列**: BullMQ + Redis
- **AI SDK**: Vercel AI SDK
- **代码风格**: Biome

## API

IntelliPick 提供双 API 接口用于访问已过滤的内容和实体：
- **RESTful API** - 标准 HTTP 端点，返回 JSON 响应
- **GraphQL API** - 灵活的查询接口，支持强类型
- **AI Chat** - 自然语言接口，由 DeepSeek 驱动

详见 [docs/api.md](./docs/api.md) 获取完整的 API 文档，以及 [docs/api-examples.md](./docs/api-examples.md) 查看使用示例。

### 快速开始

\`\`\`bash
# 启动 API 服务器
cd apps/api && pnpm dev

# 尝试健康检查
curl http://localhost:3000/health

# 获取最新内容
curl http://localhost:3000/api/v1/contents

# 打开 GraphQL playground
open http://localhost:3000/graphql
\`\`\`

### 主要端点

- `GET /health` - 健康检查
- `GET /api/v1/contents` - 内容列表（支持分页和过滤）
- `GET /api/v1/contents/:id` - 单个内容详情
- `GET /api/v1/entities` - 热门实体列表
- `GET /api/v1/entities/:id` - 单个实体详情
- `POST /api/v1/search` - 全文搜索
- `POST /api/v1/ai/chat` - AI 自然语言对话
- `POST /graphql` - GraphQL 查询

## 常用命令

```bash
# 开发
pnpm dev                 # 开发模式运行所有包
pnpm build              # 构建所有包
pnpm typecheck          # 类型检查

# 代码质量
pnpm lint               # 检查代码风格
pnpm lint:fix           # 自动修复代码风格问题
pnpm format             # 格式化代码

# 数据库
pnpm db:generate        # 生成迁移文件
pnpm db:migrate         # 运行迁移
pnpm db:push            # 直接推送 schema（开发用）
pnpm db:studio          # 打开 Drizzle Studio
```

## 文档

详见 [CLAUDE.md](./CLAUDE.md) 获取完整的开发文档。

## 许可证

MIT

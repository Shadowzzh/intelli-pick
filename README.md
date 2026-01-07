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
  api/                  # 主应用程序
packages/
  config/              # 配置加载和验证
  db/                  # 数据库 schema 和客户端
  env/                 # 环境变量验证
  shared/              # 共享类型定义
```

### 核心流程

1. **采集 (Collector)**: 从配置的数据源采集原始内容
2. **队列 (Queue)**: 使用 BullMQ 管理任务队列
3. **处理管道 (Pipeline)**:
   - 去重检查
   - 硬规则过滤
   - AI 质量评分
   - AI 实体提取
   - 存储到数据库
4. **调度 (Scheduler)**: 定时触发采集任务

## 技术栈

- **运行时**: Node.js 18+ / TypeScript
- **包管理**: pnpm workspace (monorepo)
- **构建工具**: Turbo
- **数据库**: PostgreSQL (Drizzle ORM)
- **队列**: BullMQ + Redis
- **AI SDK**: Vercel AI SDK
- **代码风格**: Biome

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

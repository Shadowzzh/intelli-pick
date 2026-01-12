# API 应用结构理解指南

<context>
快速理解 API 后端应用的架构和实现。
本文档聚焦于 HTTP API、GraphQL、Socket.IO、业务逻辑层等。
</context>

<when_to_reference_other_docs>
仅在以下情况才需要查看其他文档:
- 需要修改数据库 schema、添加新的共享类型或工具函数时 → 查看 `packages-before.md`
- 需要理解前端如何调用 API、调试前后端交互问题时 → 查看 `web-before.md`
- 只修改 API 路由、服务层、Repository 时 → 无需查看其他文档
</when_to_reference_other_docs>

## 如何理解技术栈

<instructions>
1. 读取 `apps/api/package.json`
2. 识别核心框架和中间件
3. 检查依赖的 workspace packages
4. 了解开发和构建工具
</instructions>

<dependency_patterns>
核心技术栈识别:
- **HTTP 框架**: `fastify` (高性能 Node.js 框架)
- **GraphQL**: `mercurius` (Fastify 的 GraphQL 适配器)
- **实时通信**: `socket.io`, `fastify-socket.io`
- **队列系统**: `bullmq` (Redis 队列)
- **ORM**: `drizzle-orm` (类型安全的 SQL ORM)
- **AI SDK**: `ai`, `@ai-sdk/*` (Vercel AI SDK)
- **校验**: `zod` (TypeScript schema 校验)
- **日期处理**: `dayjs`

Workspace 依赖:
- `@intellipick/config` - 配置管理
- `@intellipick/db` - 数据库 schema 和客户端
- `@intellipick/env` - 环境变量验证
- `@intellipick/events` - 事件系统 (Worker ↔ API)
- `@intellipick/shared` - 共享类型和工具函数
</dependency_patterns>

## 如何理解目录结构

<instructions>
使用 `tree -L 2 apps/api/src` 查看结构
</instructions>

<standard_structure>
典型的分层架构:
```
src/
├── routes/          # HTTP 路由层 (RESTful API)
│   └── v1/         # API 版本管理
├── services/        # 业务逻辑层
├── repositories/    # 数据访问层 (Repository 模式)
├── graphql/         # GraphQL schema 和 resolvers
├── lib/             # 工具函数和辅助模块
├── ai/              # AI 集成 (tools, prompts)
├── __tests__/       # 测试文件
├── app.ts           # Fastify 应用配置
└── index.ts         # 入口文件
```
</standard_structure>

<exploration_strategy>
按此顺序探索:
1. `src/index.ts` - 应用启动和初始化
2. `src/app.ts` - Fastify 配置、插件、中间件
3. `src/routes/v1/` - RESTful API 端点
4. `src/graphql/` - GraphQL schema 和 resolvers
5. `src/services/` - 业务逻辑实现
6. `src/repositories/` - 数据库查询封装
7. `src/lib/socket.ts` - Socket.IO 实时推送
</exploration_strategy>

## 如何理解分层架构

<architecture_layers>
<layer name="路由层 (Routes)">
职责: HTTP 请求处理、参数校验、响应格式化
- RESTful: `routes/v1/*.ts`
- GraphQL: `graphql/resolvers.ts`
模式: 调用 Service 层，返回统一响应格式
</layer>

<layer name="服务层 (Services)">
职责: 业务逻辑、跨 Repository 协调、事务管理
文件: `services/*.service.ts`
模式:
- 依赖注入 Repository
- 处理复杂业务逻辑
- 发出业务事件
</layer>

<layer name="仓库层 (Repositories)">
职责: 数据库访问、查询构建、数据映射
文件: `repositories/*.repository.ts`
模式:
- 继承 `BaseRepository`
- 使用 Drizzle ORM
- 返回类型化的数据
</layer>

<layer name="集成层 (Integrations)">
职责: 外部服务集成
- GraphQL: `graphql/`
- Socket.IO: `lib/socket.ts`
- Queue: `services/queue.service.ts`
- AI: `ai/tools.ts`
</layer>
</architecture_layers>

<key_questions>
- 路由如何映射到服务？
- 服务如何协调多个 Repository？
- 数据库事务如何处理？
- 错误如何统一处理？
- 认证和授权在哪一层？
</key_questions>

## 如何理解 GraphQL 架构

<instructions>
1. 读取 `src/graphql/schema.ts` - 类型定义
2. 读取 `src/graphql/resolvers.ts` - 查询和变更实现
3. 检查 `src/app.ts` 中的 Mercurius 配置
</instructions>

<graphql_pattern>
```typescript
// schema.ts - 定义 GraphQL 类型
export const schema = `
  type Query {
    contents(filters: ContentFilters): [Content!]!
  }

  type Content {
    id: ID!
    title: String!
  }
`;

// resolvers.ts - 实现解析器
export const resolvers = {
  Query: {
    contents: async (_, { filters }, { services }) => {
      return services.contents.getContents(filters);
    }
  }
};
```
</graphql_pattern>

<key_questions>
- Schema 如何与数据库 schema 对应？
- Resolver context 包含什么？
- 如何处理 N+1 查询问题？
- 是否使用 DataLoader？
</key_questions>

## 如何理解 Socket.IO 实时推送

<instructions>
1. 读取 `src/lib/socket.ts` - Socket.IO 服务器配置
2. 检查事件监听和广播逻辑
3. 查看 `@intellipick/events` 的集成
</instructions>

<socketio_pattern>
```typescript
// 典型的 Socket.IO 服务器模式
export function setupSocketIO(app: FastifyInstance) {
  app.register(fastifySocketIO);

  app.after(() => {
    // 监听 Worker 事件
    eventBus.on('content:new', (content) => {
      // 广播到所有客户端
      app.io.emit('content:new', content);
    });
  });
}
```
</socketio_pattern>

<key_questions>
- 支持哪些实时事件？
- 如何处理连接认证？
- 事件如何从 Worker 传递到 API？
- 是否有房间 (rooms) 或命名空间 (namespaces)？
</key_questions>

## Workspace 依赖使用

<workspace_packages>
API 依赖以下共享包:
- `@intellipick/config` - 配置加载
- `@intellipick/db` - 数据库访问
- `@intellipick/env` - 环境变量
- `@intellipick/events` - 事件系统
- `@intellipick/shared` - 共享类型

<basic_usage>
```typescript
// 数据库查询
import { db } from '@intellipick/db';
import { contents } from '@intellipick/db/schema';

// 配置访问
import { loadConfig } from '@intellipick/config';

// 事件通信
import { eventBus } from '@intellipick/events';
```
</basic_usage>

需要了解各包的详细功能时，查看 `packages-before.md`
</workspace_packages>

## 跨模块交互参考

<cross_module_reference>
<note>
以下内容仅在需要理解前后端交互时参考。
纯后端开发任务可跳过此部分。
</note>

<api_web_flow>
- Web → API: REST/GraphQL 请求
- API → Web: Socket.IO 实时推送
- Worker → API: EventBus 事件通知

需要了解前端如何调用 API 时，查看 `web-before.md`
</api_web_flow>
</cross_module_reference>

## 快速启动清单

<checklist>
理解 API 应用的快速路径:

1. ✅ 读取 `apps/api/package.json` - 识别技术栈
2. ✅ 读取 `src/index.ts` - 理解应用启动
3. ✅ 读取 `src/app.ts` - 理解中间件和插件配置
4. ✅ 浏览 `src/routes/v1/` - 理解 RESTful API
5. ✅ 浏览 `src/services/` - 理解业务逻辑
6. ✅ 浏览 `src/repositories/` - 理解数据访问

<note>
只需关注 API 层的代码组织。
需要修改共享包或理解前端调用时，再查看对应文档。
</note>
</checklist>

## 修改策略

<strategy name="添加新 API 端点">
<instructions>
1. 确定类型: RESTful 还是 GraphQL？
2. **RESTful 流程**:
   - `routes/v1/` 添加路由
   - `services/` 添加或扩展服务方法
   - `repositories/` 添加数据访问方法（如需要）
3. **GraphQL 流程**:
   - `graphql/schema.ts` 添加类型定义
   - `graphql/resolvers.ts` 添加解析器
   - `services/` 复用或添加服务方法
4. 更新相关类型定义
5. 添加测试用例
</instructions>
</strategy>

<strategy name="添加实时事件">
<instructions>
1. 在 `@intellipick/events` 定义事件类型
2. Worker 端发出事件
3. API `lib/socket.ts` 监听事件
4. 广播到 Socket.IO 客户端
5. Web 端 `useRealtime()` 接收事件
</instructions>
</strategy>

<strategy name="修改数据访问">
<instructions>
1. 修改 `@intellipick/db` schema（如需要）
2. 运行 `pnpm db:generate` 和 `pnpm db:migrate`
3. 更新 Repository 查询逻辑
4. 更新 Service 业务逻辑
5. 更新 GraphQL schema（如暴露给前端）
</instructions>
</strategy>

## 关键文件快速参考

<file_reference>
<category name="核心配置">
| 目的 | 文件路径 |
|------|---------|
| 依赖和脚本 | `apps/api/package.json` |
| 应用入口 | `src/index.ts` |
| Fastify 配置 | `src/app.ts` |
| TypeScript 配置 | `tsconfig.json` |
</category>

<category name="API 层">
| 目的 | 文件路径 |
|------|---------|
| RESTful 路由 | `src/routes/v1/*.ts` |
| GraphQL Schema | `src/graphql/schema.ts` |
| GraphQL Resolvers | `src/graphql/resolvers.ts` |
</category>

<category name="业务逻辑">
| 目的 | 文件路径 |
|------|---------|
| 服务层 | `src/services/*.service.ts` |
| 仓库层 | `src/repositories/*.repository.ts` |
| 基础仓库 | `src/repositories/base.repository.ts` |
</category>

<category name="集成">
| 目的 | 文件路径 |
|------|---------|
| Socket.IO | `src/lib/socket.ts` |
| 错误处理 | `src/lib/errors.ts` |
| AI 工具 | `src/ai/tools.ts` |
| 队列服务 | `src/services/queue.service.ts` |
</category>
</file_reference>

## 调试和测试

<debugging_tips>
1. **API 日志**: Fastify 内置 logger，查看请求/响应
2. **GraphQL Playground**: 访问 `/graphiql` 测试查询
3. **健康检查**: `GET /health` 验证服务运行
4. **Socket.IO 调试**: 使用 Socket.IO Admin UI 或客户端调试工具
5. **队列状态**: 使用 BullMQ Board 查看队列状态
6. **数据库查询**: 启用 Drizzle 日志查看 SQL
</debugging_tips>

<testing_strategy>
- 单元测试: `src/__tests__/*.test.ts`
- API 测试: 使用 Fastify inject 或实际 HTTP 请求
- GraphQL 测试: 执行查询并验证响应
- 集成测试: 测试完整的请求流程
</testing_strategy>

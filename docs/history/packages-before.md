# Packages 共享包理解指南

<context>
快速理解 monorepo 中的共享包架构和使用方式。
本文档聚焦于数据库 schema、配置系统、共享类型、事件系统等基础设施。
</context>

<when_to_reference_other_docs>
仅在以下情况才需要查看其他文档:
- 需要理解某个包在具体应用中如何被使用时 → 查看 `api-before.md` 或 `web-before.md`
- 需要调试跨应用的数据流或类型问题时 → 查看相应应用的文档
- 只修改 package 内部代码、添加新的共享功能时 → 无需查看其他文档
</when_to_reference_other_docs>

## Monorepo Packages 概览

<package_overview>
IntelliPick 使用 pnpm workspace 管理多个共享包:

```
packages/
├── config/      # 配置管理 (config.ts 加载和验证)
├── db/          # 数据库 (Drizzle ORM schema + 客户端)
├── env/         # 环境变量验证 (基于 @t3-oss/env-core)
├── events/      # 事件系统 (Worker ↔ API 通信)
├── shared/      # 共享类型、工具函数、常量
└── test-scripts/ # 测试脚本和工具
```

各应用的依赖关系:
- **API**: 使用全部 5 个核心包
- **Worker**: 使用 config, db, env, events, shared
- **Web**: 主要使用 db (类型), shared (类型和工具)
</package_overview>

## 如何理解各个 Package

### 1. @intellipick/config

<package name="config">
<purpose>
统一的配置管理系统，从根目录 `config.ts` 加载用户配置。
</purpose>

<instructions>
1. 读取 `packages/config/package.json` - 依赖关系
2. 查看 `packages/config/src/schema.ts` - 配置 schema 定义
3. 查看 `packages/config/src/index.ts` - 加载逻辑
4. 参考根目录 `config.ts` - 实际配置文件
</instructions>

<key_concepts>
- 使用 `jiti` 加载 TypeScript 配置文件
- 使用 `zod` 进行 schema 验证
- 提供类型安全的配置对象
- 支持配置验证和默认值
</key_concepts>

<usage_example>
```typescript
import { loadConfig } from '@intellipick/config';

const config = await loadConfig();
// config.ai.providers[0].model
// config.sources[0].url
// config.filters.blacklist.domains
```
</usage_example>

<key_files>
- `src/schema.ts` - Zod schema 定义
- `src/index.ts` - `loadConfig()` 函数
- `src/types.ts` - TypeScript 类型导出
</key_files>
</package>

### 2. @intellipick/db

<package name="db">
<purpose>
数据库 schema 定义和 Drizzle ORM 客户端，所有应用共享同一套 schema。
</purpose>

<instructions>
1. 读取 `packages/db/package.json` - 了解 Drizzle 版本
2. 浏览 `packages/db/src/schema/` - 所有表定义
3. 查看 `packages/db/src/client.ts` - 数据库连接
4. 检查 `packages/db/drizzle.config.ts` - Drizzle 配置
</instructions>

<key_concepts>
- 使用 Drizzle ORM (类型安全的 SQL)
- PostgreSQL 16 + 时区支持
- Schema 版本控制 (migrations)
- 导出表定义和类型
</key_concepts>

<schema_structure>
```
packages/db/src/schema/
├── contents.ts         # 内容表
├── entities.ts         # 实体表
├── entity-mentions.ts  # 实体提及关系表
├── sources.ts          # 数据源表
├── tags.ts            # 标签表
├── quarantine.ts      # 隔离区表
└── index.ts           # 统一导出
```
</schema_structure>

<usage_example>
```typescript
import { db } from '@intellipick/db';
import { contents, entities } from '@intellipick/db/schema';
import { eq } from 'drizzle-orm';

// 查询
const allContents = await db.select().from(contents);

// 带条件
const entity = await db
  .select()
  .from(entities)
  .where(eq(entities.id, '123'));

// 插入
await db.insert(contents).values({ ... });
```
</usage_example>

<key_files>
- `src/schema/*.ts` - 各表的 schema 定义
- `src/client.ts` - 数据库客户端实例
- `drizzle.config.ts` - Drizzle Kit 配置
- `drizzle/` - 迁移文件目录
</key_files>
</package>

### 3. @intellipick/env

<package name="env">
<purpose>
环境变量验证和类型化，基于 @t3-oss/env-core 构建。
</purpose>

<instructions>
1. 读取 `packages/env/src/index.ts` - 环境变量 schema
2. 查看根目录 `.env.example` - 所需的环境变量
3. 检查类型导出和使用方式
</instructions>

<key_concepts>
- 使用 Zod schema 验证环境变量
- 区分 server 和 client 环境变量
- 提供类型安全的 `env` 对象
- 启动时验证，避免运行时错误
</key_concepts>

<usage_example>
```typescript
import { env } from '@intellipick/env';

// 类型安全的环境变量访问
const dbUrl = env.DATABASE_URL;
const redisUrl = env.REDIS_URL;
const apiKey = env.DEEPSEEK_API_KEY;
```
</usage_example>

<key_files>
- `src/index.ts` - 环境变量定义和导出
</key_files>
</package>

### 4. @intellipick/events

<package name="events">
<purpose>
Worker 和 API 之间的事件通信系统，基于 EventEmitter。
</purpose>

<instructions>
1. 读取 `packages/events/src/index.ts` - 事件定义
2. 查看 Worker 如何发出事件
3. 查看 API 如何监听事件并广播到 Socket.IO
</instructions>

<key_concepts>
- 单例 EventEmitter 实例
- 类型安全的事件名称和 payload
- 跨进程通信的基础
- 支持多个监听器
</key_concepts>

<event_flow>
```
Worker (采集/处理)
    ↓ emit('content:new', content)
EventBus (@intellipick/events)
    ↓ on('content:new')
API (Socket.IO)
    ↓ io.emit('content:new')
Web (useRealtime hook)
```
</event_flow>

<usage_example>
```typescript
import { eventBus } from '@intellipick/events';

// Worker 发出事件
eventBus.emit('content:new', {
  id: '123',
  title: 'New content',
  // ...
});

// API 监听事件
eventBus.on('content:new', (content) => {
  io.emit('content:new', content);
});
```
</usage_example>

<key_files>
- `src/index.ts` - EventEmitter 单例和类型定义
</key_files>
</package>

### 5. @intellipick/shared

<package name="shared">
<purpose>
共享的类型定义、工具函数、常量，避免代码重复。
</purpose>

<instructions>
1. 读取 `packages/shared/package.json`
2. 浏览 `packages/shared/src/` 目录
3. 识别可复用的类型和函数
</instructions>

<key_concepts>
- 跨应用共享的 TypeScript 类型
- 通用工具函数（日期、字符串、验证）
- 业务常量（分类、标签、状态）
- 无运行时依赖（轻量级）
</key_concepts>

<typical_exports>
```typescript
// 类型定义
export interface RawContent { ... }
export interface ProcessedContent { ... }
export type ContentCategory = '技术' | '商业' | ...;

// 工具函数
export function toUTCISOString(date: Date): string;
export function slugify(text: string): string;

// 常量
export const CATEGORIES = ['技术', '商业', ...];
export const ENTITY_TYPES = ['人物', '组织', ...];
```
</typical_exports>

<usage_example>
```typescript
import { toUTCISOString, type RawContent } from '@intellipick/shared';

const content: RawContent = {
  publishedAt: toUTCISOString(new Date()),
  // ...
};
```
</usage_example>

<key_files>
- `src/types/*.ts` - 类型定义
- `src/utils/*.ts` - 工具函数
- `src/constants/*.ts` - 常量定义
- `src/index.ts` - 统一导出
</key_files>
</package>

## 包之间的依赖关系

<package_dependencies>
```
┌─────────────────────────────────────────┐
│         Applications 应用层              │
│  ┌────────┐  ┌─────────┐  ┌──────────┐  │
│  │  API   │  │ Worker  │  │   Web    │  │
│  └───┬────┘  └────┬────┘  └─────┬────┘  │
└──────┼───────────┼──────────────┼───────┘
       │           │              │
       ↓           ↓              ↓
┌─────────────────────────────────────────┐
│         Packages 共享层                  │
│                                          │
│  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │ config │  │   db   │  │  shared  │  │
│  └────────┘  └────────┘  └──────────┘  │
│                                          │
│  ┌────────┐  ┌────────┐                 │
│  │  env   │  │ events │                 │
│  └────────┘  └────────┘                 │
└─────────────────────────────────────────┘
       │           │              │
       ↓           ↓              ↓
┌─────────────────────────────────────────┐
│      External 外部依赖                   │
│  PostgreSQL  Redis  AI Provider         │
└─────────────────────────────────────────┘
```

依赖规则:
- **config** 无内部依赖
- **db** 依赖 env (数据库连接)
- **env** 无内部依赖
- **events** 无内部依赖
- **shared** 无内部依赖
- **应用** 可依赖任意 package
</package_dependencies>

## 如何添加新的共享功能

<strategy name="添加新类型定义">
<instructions>
1. 确定类型属于哪个领域
2. 在 `packages/shared/src/types/` 添加类型文件
3. 在 `packages/shared/src/index.ts` 导出
4. 在应用中导入使用
5. 考虑是否需要 Zod schema 验证
</instructions>
</strategy>

<strategy name="添加新数据表">
<instructions>
1. 在 `packages/db/src/schema/` 创建表定义
2. 在 `packages/db/src/schema/index.ts` 导出
3. 运行 `pnpm db:generate` 生成迁移
4. 运行 `pnpm db:migrate` 应用迁移
5. 在应用的 Repository 中使用新表
</instructions>
</strategy>

<strategy name="添加新工具函数">
<instructions>
1. 确定函数属于哪个类别（日期、字符串、验证等）
2. 在 `packages/shared/src/utils/` 添加或扩展文件
3. 编写函数和 JSDoc 注释
4. 添加单元测试（如果包配置了测试）
5. 在 `packages/shared/src/index.ts` 导出
6. 在应用中导入使用
</instructions>
</strategy>

<strategy name="添加新事件类型">
<instructions>
1. 在 `packages/events/src/index.ts` 定义事件类型
2. Worker 端 emit 事件
3. API 端 on 监听事件
4. 考虑事件 payload 的类型安全
</instructions>
</strategy>

## 包的版本管理

<versioning>
<workspace_protocol>
所有内部包使用 `workspace:*` 协议:
```json
{
  "dependencies": {
    "@intellipick/db": "workspace:*",
    "@intellipick/shared": "workspace:*"
  }
}
```

优势:
- 始终使用最新的本地版本
- 无需手动更新版本号
- pnpm 自动链接到本地包
</workspace_protocol>

<changesets>
如果使用 Changesets 管理版本:
1. 修改包后运行 `pnpm changeset`
2. 选择包和版本类型（patch/minor/major）
3. 描述变更
4. CI 自动创建版本 PR
</changesets>
</versioning>

## 包的构建和发布

<build_config>
大多数包不需要构建（纯 TypeScript）：
- `config`: 使用 jiti 运行时加载
- `db`: Drizzle schema 直接导入
- `shared`: 纯类型定义和简单函数
- `env`: 环境变量定义
- `events`: EventEmitter 包装

如果需要构建:
- 使用 `tsup` 或 `tsc`
- 配置 `package.json` 的 `exports` 字段
- 生成 `.d.ts` 类型定义文件
</build_config>

## 快速启动清单

<checklist>
理解共享包的快速路径:

1. ✅ 浏览 `packages/` 目录 - 了解所有包
2. ✅ 读取各包的 `package.json` - 了解依赖关系
3. ✅ 查看 `@intellipick/db/src/schema/` - 了解数据模型
4. ✅ 查看 `@intellipick/shared/src/` - 了解共享类型
5. ✅ 查看 `@intellipick/config/src/schema.ts` - 了解配置结构

<note>
专注于包本身的功能和结构。
需要了解包在具体应用中的使用时，再查看对应应用文档。
</note>
</checklist>

## 关键文件快速参考

<file_reference>
<category name="配置和环境">
| 包 | 关键文件 |
|----|---------|
| config | `src/schema.ts`, `src/index.ts` |
| env | `src/index.ts` |
| 根目录 | `config.ts`, `.env` |
</category>

<category name="数据库">
| 包 | 关键文件 |
|----|---------|
| db | `src/schema/*.ts`, `src/client.ts` |
| db | `drizzle.config.ts`, `drizzle/*.sql` |
</category>

<category name="共享代码">
| 包 | 关键文件 |
|----|---------|
| shared | `src/types/*.ts`, `src/utils/*.ts` |
| events | `src/index.ts` |
</category>
</file_reference>

## 调试技巧

<debugging_tips>
1. **包导入问题**: 检查 `package.json` 的 `workspace:*` 依赖
2. **类型不匹配**: 确保所有应用使用相同版本的共享包
3. **环境变量**: 检查 `.env` 和 `@intellipick/env` 的 schema
4. **数据库迁移**: 使用 `pnpm db:studio` 查看实际数据
5. **事件未触发**: 检查 EventBus 的 emit/on 是否在同一进程
6. **配置加载失败**: 检查 `config.ts` 语法和 Zod 验证
</debugging_tips>

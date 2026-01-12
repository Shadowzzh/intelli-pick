# Packages 共享包理解指南

<context>
快速理解 monorepo 中的共享包架构和使用方式。
本文档聚焦于数据库 schema、配置系统、共享类型、事件系统等基础设施。
</context>

<quick_reference>
  <module>packages</module>
  <location>packages/</location>
  <packages>config, db, env, events, shared</packages>
  <key_tech>Drizzle ORM (db) + Zod (config/env) + EventEmitter (events)</key_tech>
  <main_files>
    db: src/schema/*.ts, src/client.ts
    config: src/schema.ts, src/index.ts
    shared: src/types/*.ts, src/utils/*.ts
  </main_files>
</quick_reference>

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
<purpose>统一的配置管理系统，从根目录 `config.ts` 加载用户配置</purpose>
<tech>jiti (TS 加载) + Zod (验证)</tech>
<key_exports>loadConfig(), Config 类型</key_exports>
<key_files>src/schema.ts (Zod schema), src/index.ts (加载器)</key_files>
<usage>读取根目录 config.ts，验证后返回类型安全的配置对象</usage>
</package>

### 2. @intellipick/db

<package name="db">
<purpose>数据库 schema 定义和 Drizzle ORM 客户端</purpose>
<tech>Drizzle ORM + PostgreSQL 16</tech>
<key_exports>db (客户端), schema (contents, entities, tags, sources, quarantine, entityMentions)</key_exports>
<key_files>src/schema/*.ts (表定义), src/client.ts (连接), drizzle/ (迁移)</key_files>
<schema_tables>contents, entities, entity-mentions, sources, tags, quarantine</schema_tables>
</package>

### 3. @intellipick/env

<package name="env">
<purpose>环境变量验证和类型化</purpose>
<tech>@t3-oss/env-core + Zod</tech>
<key_exports>env (类型安全的环境变量对象)</key_exports>
<key_files>src/index.ts (schema 定义)</key_files>
<usage>启动时验证环境变量，提供类型安全访问</usage>
</package>

### 4. @intellipick/events

<package name="events">
<purpose>Worker 和 API 之间的事件通信系统</purpose>
<tech>EventEmitter (Node.js 内置)</tech>
<key_exports>eventBus (单例 EventEmitter)</key_exports>
<key_files>src/index.ts (事件定义和类型)</key_files>
<event_flow>Worker emit → EventBus → API on → Socket.IO broadcast → Web</event_flow>
</package>

### 5. @intellipick/shared

<package name="shared">
<purpose>共享的类型定义、工具函数、常量</purpose>
<tech>纯 TypeScript (无运行时依赖)</tech>
<key_exports>
  - 类型: RawContent, ProcessedContent, ContentCategory, EntityType
  - 工具: toUTCISOString, slugify, 验证函数
  - 常量: CATEGORIES, ENTITY_TYPES
</key_exports>
<key_files>src/types/*.ts (类型), src/utils/*.ts (工具), src/constants/*.ts (常量)</key_files>
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

## 包管理要点

<package_management>
- **版本**: 使用 `workspace:*` 协议，pnpm 自动链接本地包
- **构建**: 大多数包无需构建（纯 TS），直接使用源码
- **迁移**: 数据库变更用 `pnpm db:generate` + `pnpm db:migrate`
</package_management>

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

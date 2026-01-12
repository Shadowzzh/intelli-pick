# Worker 应用结构理解指南

<context>
快速理解 Worker 后台处理应用的架构和实现。
本文档聚焦于数据采集、内容处理管道、定时调度等后台任务。
</context>

<quick_reference>
  <module>worker</module>
  <location>apps/worker</location>
  <stack>BullMQ 5 + AI SDK 4 + Cron 3 + RSS Parser + Twitter API + Cheerio</stack>
  <key_dirs>collector, pipeline, scheduler, lib</key_dirs>
  <main_files>src/index.ts, src/worker.ts, src/pipeline.ts</main_files>
</quick_reference>

<when_to_reference_other_docs>
仅在以下情况才需要查看其他文档:
- 需要理解如何向 API 发送事件、调试 Worker-API 通信时 → 查看 `api-before.md`
- 需要修改数据库 schema、添加新的共享类型时 → 查看 `packages-before.md`
- 只修改采集逻辑、处理管道、定时任务时 → 无需查看其他文档
</when_to_reference_other_docs>

## 如何理解技术栈

<instructions>
1. 读取 `apps/worker/package.json`
2. 识别核心依赖：队列、AI、采集、解析
3. 检查依赖的 workspace packages
</instructions>

<dependency_patterns>
核心技术栈识别:
- **队列系统**: `bullmq`, `ioredis` (Redis 队列)
- **AI 集成**: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`
- **数据采集**: `rss-parser`, `twitter-api-v2`, `undici`
- **内容解析**: `cheerio` (HTML 解析)
- **定时任务**: `cron` (定时调度)
- **日志**: `pino` (高性能日志)
- **ORM**: `drizzle-orm` (数据库访问)

Workspace 依赖:
- `@intellipick/config` - 配置管理
- `@intellipick/db` - 数据库访问
- `@intellipick/env` - 环境变量
- `@intellipick/events` - 事件系统 (发送到 API)
- `@intellipick/shared` - 共享类型和工具
</dependency_patterns>

## 如何理解目录结构

<instructions>
使用 `tree -L 2 apps/worker/src` 查看结构
</instructions>

<standard_structure>
插件化 + 管道架构:
```
src/
├── collector/       # 数据采集层（插件化）
│   ├── plugins/    # 采集插件（RSS, Twitter, V2EX）
│   ├── manager.ts  # 插件管理器
│   └── types.ts    # 采集器类型定义
├── pipeline/        # 处理管道层（顺序执行）
│   ├── dedup.ts    # 去重步骤
│   ├── hard-filter.ts  # 硬规则过滤
│   ├── ai-filter.ts    # AI 质量评分
│   ├── ai-extract.ts   # AI 实体提取
│   ├── storage.ts      # 数据存储
│   └── types.ts        # 管道类型定义
├── scheduler/       # 定时调度层
│   ├── source-scheduler.ts  # 数据源调度
│   └── cron-converter.ts    # Cron 表达式转换
├── lib/             # 工具函数层
│   ├── ai.ts       # AI 客户端
│   ├── dedup.ts    # 去重逻辑
│   ├── proxy.ts    # 代理配置
│   ├── logger.ts   # 日志工具
│   └── sources.ts  # 数据源同步
├── index.ts         # 应用入口
├── worker.ts        # BullMQ Worker
└── pipeline.ts      # Pipeline 主逻辑
```
</standard_structure>

<exploration_strategy>
按此顺序探索:
1. `src/index.ts` - 应用启动和初始化
2. `src/scheduler/` - 定时任务如何触发采集
3. `src/collector/` - 采集器插件系统
4. `src/worker.ts` - BullMQ 队列消费
5. `src/pipeline.ts` - 处理管道流程
6. `src/pipeline/*` - 各个处理步骤
</exploration_strategy>

## 如何理解核心工作流

<workflow>
<step1_collect>
**1. 数据采集 (Collector)**
- Scheduler 触发 → CollectorManager 调用插件
- 插件采集原始数据 → 生成 RawContent
- 发送到 BullMQ 队列
</step1_collect>

<step2_process>
**2. 队列处理 (Worker)**
- BullMQ Worker 消费队列
- 每条 RawContent 进入 Pipeline 处理
- 并发度: 5 个 job 同时处理
</step2_process>

<step3_pipeline>
**3. 处理管道 (Pipeline)**
顺序执行的步骤链，每步可以过滤或增强内容:
1. **DedupStep** - 去重检查
2. **HardFilterStep** - 硬规则过滤（黑名单、垃圾关键词）
3. **AiFilterStep** - AI 质量评分和安全检查
4. **AiExtractStep** - AI 实体提取和分类
5. **StorageStep** - 存储到数据库或隔离区

任一步骤返回 null → 内容被过滤，管道终止
</step3_pipeline>

<step4_event>
**4. 事件通知**
- 新内容存储成功 → emit 事件到 EventBus
- API 监听事件 → Socket.IO 广播到前端
</step4_event>
</workflow>

## 如何理解采集器插件

<collector_architecture>
<plugin_system>
插件化设计，每个数据源类型对应一个插件:
- **RssPlugin** - RSS feed 采集
- **TwitterPlugin** - Twitter timeline 采集
- **V2exPlugin** - V2EX 最新主题采集

插件必须实现 `CollectorPlugin` 接口:
- `collect()` - 采集数据，返回 RawContent[]
- `sourceType` - 数据源类型标识
</plugin_system>

<key_files>
- `collector/manager.ts` - CollectorManager (管理所有插件)
- `collector/plugins/rss.ts` - RSS 插件
- `collector/plugins/twitter.ts` - Twitter 插件
- `collector/plugins/v2ex.ts` - V2EX 插件
- `collector/types.ts` - 插件接口定义
</key_files>
</collector_architecture>

## 如何理解处理管道

<pipeline_architecture>
<pattern>
责任链模式 (Chain of Responsibility):
- 每个步骤是独立的 `PipelineStep`
- 顺序执行，前一步的输出是后一步的输入
- 任一步骤返回 null，管道终止
</pattern>

<step_interface>
```typescript
interface PipelineStep {
  process(input: any): Promise<any | null>;
}
```
</step_interface>

<key_files>
- `pipeline/index.ts` - Pipeline 类（步骤编排）
- `pipeline.ts` - 创建和配置 Pipeline
- `pipeline/dedup.ts` - 去重步骤
- `pipeline/hard-filter.ts` - 硬规则过滤
- `pipeline/ai-filter.ts` - AI 质量过滤
- `pipeline/ai-extract.ts` - AI 实体提取
- `pipeline/storage.ts` - 数据存储
</key_files>
</pipeline_architecture>

## 如何理解调度系统

<scheduler_architecture>
<scheduling_logic>
- 使用 `cron` 包创建定时任务
- 每个数据源独立的采集间隔
- 启动时立即执行一次采集
- 支持优雅关闭
</scheduling_logic>

<key_files>
- `scheduler/source-scheduler.ts` - SourceScheduler 类
- `scheduler/cron-converter.ts` - Cron 表达式工具
- `scheduler/index.ts` - 调度器初始化
</key_files>
</scheduler_architecture>

## Workspace 依赖使用

<workspace_packages>
Worker 使用共享包:
- `@intellipick/config` - 加载数据源配置、AI 配置
- `@intellipick/db` - 写入处理后的内容
- `@intellipick/env` - 环境变量访问
- `@intellipick/events` - 发送事件到 API
- `@intellipick/shared` - 共享类型和工具函数

需要了解各包的详细功能时，查看 `packages-before.md`
</workspace_packages>

## 跨模块交互参考

<cross_module_reference>
<note>
以下内容仅在需要理解跨模块交互时参考。
纯 Worker 开发任务可跳过此部分。
</note>

<worker_api_flow>
- Worker 采集内容 → 处理管道 → 存储到数据库
- Worker emit 事件 → EventBus → API 监听
- API 接收事件 → Socket.IO 广播 → Web 前端

需要了解 API 如何处理事件时，查看 `api-before.md`
</worker_api_flow>
</cross_module_reference>

## 快速启动清单

<checklist>
理解 Worker 应用的快速路径:

1. ✅ 读取 `apps/worker/package.json` - 识别技术栈
2. ✅ 读取 `src/index.ts` - 理解应用启动
3. ✅ 浏览 `src/collector/plugins/` - 理解采集插件
4. ✅ 查看 `src/pipeline.ts` - 理解处理流程
5. ✅ 浏览 `src/pipeline/*` - 理解各处理步骤
6. ✅ 查看 `src/scheduler/` - 理解定时调度

<note>
专注于 Worker 的采集和处理逻辑。
需要修改共享包或理解 API 交互时，再查看对应文档。
</note>
</checklist>

## 修改策略

<strategy name="添加新数据源">
<instructions>
1. 在 `collector/plugins/` 创建新插件
2. 实现 `CollectorPlugin` 接口
3. 在 `collector/index.ts` 注册插件
4. 在根目录 `config.ts` 添加数据源配置
5. 在 `packages/config/src/schema.ts` 添加配置 schema
</instructions>
</strategy>

<strategy name="添加新处理步骤">
<instructions>
1. 在 `pipeline/` 创建新步骤文件
2. 实现 `PipelineStep` 接口
3. 在 `pipeline.ts` 的 Pipeline 构造函数中插入到合适位置
4. 考虑步骤顺序：去重 → 硬过滤 → AI 过滤 → AI 提取 → 存储
</instructions>
</strategy>

<strategy name="修改 AI 逻辑">
<instructions>
1. 修改 `lib/ai.ts` - AI 客户端配置
2. 修改 `pipeline/ai-filter.ts` - AI 过滤逻辑
3. 修改 `pipeline/ai-extract.ts` - AI 提取逻辑
4. 调整 prompt 或 schema
5. 测试 AI 输出质量
</instructions>
</strategy>

## 关键文件快速参考

<file_reference>
<category name="核心流程">
| 目的 | 文件路径 |
|------|---------|
| 应用入口 | `src/index.ts` |
| BullMQ Worker | `src/worker.ts` |
| Pipeline 主逻辑 | `src/pipeline.ts` |
</category>

<category name="数据采集">
| 目的 | 文件路径 |
|------|---------|
| 插件管理 | `src/collector/manager.ts` |
| RSS 插件 | `src/collector/plugins/rss.ts` |
| Twitter 插件 | `src/collector/plugins/twitter.ts` |
| V2EX 插件 | `src/collector/plugins/v2ex.ts` |
</category>

<category name="处理管道">
| 目的 | 文件路径 |
|------|---------|
| 去重步骤 | `src/pipeline/dedup.ts` |
| 硬过滤步骤 | `src/pipeline/hard-filter.ts` |
| AI 过滤步骤 | `src/pipeline/ai-filter.ts` |
| AI 提取步骤 | `src/pipeline/ai-extract.ts` |
| 存储步骤 | `src/pipeline/storage.ts` |
</category>

<category name="调度和工具">
| 目的 | 文件路径 |
|------|---------|
| 定时调度 | `src/scheduler/source-scheduler.ts` |
| AI 客户端 | `src/lib/ai.ts` |
| 日志工具 | `src/lib/logger.ts` |
| 代理配置 | `src/lib/proxy.ts` |
</category>
</file_reference>

## 调试和监控

<debugging_tips>
1. **日志查看**: Worker 使用 Pino，检查日志输出
2. **队列状态**: 使用 BullMQ Board 查看队列和 job 状态
3. **采集测试**: 单独运行某个插件的 collect() 方法
4. **Pipeline 调试**: 在各步骤添加日志查看数据流转
5. **AI 输出**: 检查 AI 返回的 JSON 是否符合 schema
6. **事件发送**: 确认 EventBus.emit() 被调用
</debugging_tips>

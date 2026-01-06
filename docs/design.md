# AI Filter - 设计文档

> AI 驱动的个人信息过滤器 - 从订阅的信息源中智能筛选高价值内容并通知

## 1. 项目概述

### 1.1 核心需求

- 个人使用，订阅多个信息源（Twitter、V2EX、LinuxDO、RSS、周刊等）
- 把所有内容拉下来，进行整理、分析、分类、去重、判断价值
- 过滤掉低质量内容，只推送高质量干货
- 支持实时推送 + 定时汇总 + 主动查询（日/周/月）

### 1.2 核心处理逻辑

```
任何来源的内容
      │
      ▼
┌─────────────────────────────────┐
│  1. 判断内容类型                 │
│                                 │
│  - 聚合推荐（周刊、清单）→ 拆解  │
│  - 单条内容 → 直接分析           │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  2. 提取实体                    │
│                                 │
│  从内容中识别提到的：            │
│  - 工具 / 项目 / 库              │
│  - 文章 / 教程                  │
│  - 人物 / 公司                  │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  3. 实体去重汇总                 │
│                                 │
│  同一个工具被多个地方提到？       │
│  → 合并，记录来源，计数 +1       │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  4. 分析判断价值                 │
│                                 │
│  用模式 + 证据判断               │
└─────────────────────────────────┘
      │
      ▼
     存储 + 推送
```

---

## 2. 技术栈

| 类别 | 选择 |
|-----|------|
| 语言 | TypeScript |
| 运行时 | Node.js 18+ |
| API 框架 | Fastify |
| Monorepo | Turborepo + pnpm |
| Lint/Format | Biome |
| 数据库 | PostgreSQL + Drizzle ORM |
| 任务队列 | BullMQ + Redis |
| AI SDK | Vercel AI SDK (ai, @ai-sdk/openai, @ai-sdk/anthropic) |
| 未来 TUI | Ink |

---

## 3. 项目结构

```
ai-filter/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── collector/           # 采集领域
│   │   │   │   ├── manager.ts
│   │   │   │   ├── plugins/
│   │   │   │   │   ├── twitter.ts
│   │   │   │   │   ├── rss.ts
│   │   │   │   │   └── v2ex.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── processor/           # 处理领域
│   │   │   │   ├── pipeline.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── dedup.ts
│   │   │   │   ├── analyzers/
│   │   │   │   │   ├── content-type-detector.ts
│   │   │   │   │   ├── entity-extractor.ts
│   │   │   │   │   └── pattern-matcher.ts
│   │   │   │   ├── classifiers/
│   │   │   │   │   └── tagger.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── notifier/            # 推送领域
│   │   │   │   ├── manager.ts
│   │   │   │   ├── plugins/
│   │   │   │   │   ├── telegram.ts
│   │   │   │   │   └── email.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── api/                 # HTTP 接口
│   │   │   │   ├── routes/
│   │   │   │   │   ├── contents.ts
│   │   │   │   │   ├── entities.ts
│   │   │   │   │   ├── tags.ts
│   │   │   │   │   └── search.ts
│   │   │   │   └── server.ts
│   │   │   │
│   │   │   ├── lib/                 # 共享基础
│   │   │   │   ├── base-plugin.ts
│   │   │   │   ├── scheduler.ts
│   │   │   │   ├── ai.ts
│   │   │   │   └── logger.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   └── tui/                         # 未来 TUI (Ink)
│       └── package.json
│
├── packages/
│   ├── db/                          # 数据库层
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── sources.ts
│   │   │   │   ├── contents.ts
│   │   │   │   ├── entities.ts
│   │   │   │   ├── entity-mentions.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── content-tags.ts
│   │   │   │   └── push-logs.ts
│   │   │   ├── client.ts
│   │   │   └── queries/
│   │   ├── drizzle/
│   │   └── package.json
│   │
│   └── shared/                      # 共享类型 + 工具
│       ├── src/
│       │   ├── types/
│       │   ├── config/
│       │   └── utils/
│       └── package.json
│
├── config.yaml                      # 用户配置
├── turbo.json                       # Turborepo 配置
├── biome.json                       # Biome 配置
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Scheduler (Cron + Event-driven)                  │
│                   定时任务调度 + 实时事件触发                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CollectorManager (采集管理器)                      │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐                │
│    │ Twitter  │      │   RSS    │      │   V2EX   │   [可扩展]      │
│    │ Plugin   │      │  Plugin  │      │  Plugin  │                │
│    └──────────┘      └──────────┘      └──────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼ (原始内容)
                       ┌─────────────────────┐
                       │    BullMQ Queue     │
                       │    (Redis 支持)      │
                       └─────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Pipeline (处理流水线)                           │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  1. 去重过滤                                                    ││
│  └────────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  2. 内容类型判断                                                ││
│  │     - 聚合推荐（周刊、清单）→ 拆解提取                           ││
│  │     - 单条内容 → 直接分析                                       ││
│  └────────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  3. 实体提取                                                    ││
│  │     提取：工具/项目/文章/人物                                    ││
│  └────────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  4. 实体去重汇总                                                ││
│  │     同一实体合并，记录来源，计数+1                               ││
│  └────────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  5. 模式匹配 + 价值判断                                         ││
│  │     用模式 + 证据判断是否有价值                                  ││
│  └────────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  6. 分类打标签                                                  ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────────┐
                  │     PostgreSQL (Drizzle ORM)        │
                  │                                     │
                  │  sources / contents / entities      │
                  │  entity_mentions / tags / push_logs │
                  └─────────────────────────────────────┘
                          │                    │
             ┌────────────┘                    └────────────┐
             ▼                                              ▼
┌─────────────────────────┐                  ┌─────────────────────────┐
│   NotifierManager       │                  │     Fastify API         │
│   (推送管理器)           │                  │     (查询接口)           │
│                         │                  │                         │
│  ┌─────────────┐        │                  │  GET /contents          │
│  │  Telegram   │        │                  │  GET /entities          │
│  │   Plugin    │        │                  │  GET /tags              │
│  ├─────────────┤        │                  │  GET /search            │
│  │   Email     │        │                  │                         │
│  │   Plugin    │        │                  └─────────────────────────┘
│  └─────────────┘        │                              │
│  [可扩展]                │                              ▼
└─────────────────────────┘                   ┌─────────────────┐
             │                                │   TUI (Ink)     │
             ▼                                │   (未来功能)     │
      实时推送 + 定时摘要                       └─────────────────┘
```

---

## 5. 数据模型

### 5.1 sources - 信息源配置

```typescript
export const sources = pgTable('sources', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  name: text('name').notNull(),           // 源名称
  type: text('type').notNull(),           // twitter | rss | v2ex | ...

  config: jsonb('config').notNull(),      // 类型相关配置

  enabled: boolean('enabled').default(true),
  fetchInterval: integer('fetch_interval').default(300),
  lastFetchedAt: timestamp('last_fetched_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 5.2 contents - 原始内容

```typescript
export const contents = pgTable('contents', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  // 来源
  sourceId: text('source_id').references(() => sources.id),
  externalId: text('external_id'),
  url: text('url'),
  author: text('author'),

  // 原始内容
  rawContent: text('raw_content').notNull(),

  // 内容类型
  contentType: text('content_type'),  // single | aggregation

  // 处理结果
  processed: boolean('processed').default(false),
  passed: boolean('passed').default(false),

  // 模式匹配结果
  matchedPattern: text('matched_pattern'),
  patternEvidence: jsonb('pattern_evidence'),

  // 结构化理解
  surface: text('surface'),           // 表层描述
  abstraction: text('abstraction'),   // 抽象主张

  // 时间
  publishedAt: timestamp('published_at'),
  collectedAt: timestamp('collected_at').defaultNow(),

  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 5.3 entities - 实体（工具/项目/文章）

```typescript
export const entities = pgTable('entities', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  name: text('name').notNull(),
  type: text('type').notNull(),  // tool | project | article | library | person | org
  url: text('url'),
  description: text('description'),

  // 统计
  mentionCount: integer('mention_count').default(1),
  firstMentionedAt: timestamp('first_mentioned_at'),
  lastMentionedAt: timestamp('last_mentioned_at'),

  // 模式匹配结果
  matchedPattern: text('matched_pattern'),
  patternEvidence: jsonb('pattern_evidence'),
  passed: boolean('passed').default(false),

  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 5.4 entity_mentions - 实体提及记录

```typescript
export const entityMentions = pgTable('entity_mentions', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  entityId: text('entity_id').references(() => entities.id),
  contentId: text('content_id').references(() => contents.id),
  sourceId: text('source_id').references(() => sources.id),

  context: text('context'),           // 提及的上下文
  recommendReason: text('recommend_reason'),  // 推荐理由（如果有）

  mentionedAt: timestamp('mentioned_at').defaultNow(),
});
```

### 5.5 tags - 标签

```typescript
export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  name: text('name').notNull().unique(),
  category: text('category'),  // topic | content_type | custom
  description: text('description'),

  createdAt: timestamp('created_at').defaultNow(),
});
```

### 5.6 content_tags / entity_tags - 多对多关系

```typescript
export const contentTags = pgTable('content_tags', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  contentId: text('content_id').references(() => contents.id),
  tagId: text('tag_id').references(() => tags.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const entityTags = pgTable('entity_tags', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  entityId: text('entity_id').references(() => entities.id),
  tagId: text('tag_id').references(() => tags.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 5.7 push_logs - 推送记录

```typescript
export const pushLogs = pgTable('push_logs', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  entityId: text('entity_id').references(() => entities.id),
  contentId: text('content_id').references(() => contents.id),

  channel: text('channel').notNull(),  // telegram | email
  pushMode: text('push_mode').notNull(),  // realtime | daily

  status: text('status').default('pending'),
  sentAt: timestamp('sent_at'),
  error: text('error'),

  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 6. 模式定义（过滤算法）

### 6.1 模式结构

```yaml
pattern:
  name: 模式名称
  intent: 信号意图
  must: 硬性条件（必须全部满足）
  any_of: 支撑条件（满足其一即可）
  extract: 需要输出的字段
```

### 6.2 完整模式表

```yaml
patterns:

  - name: "新发布"
    intent: emergence
    must:
      - "提到具体产品/项目/工具名称"
    any_of:
      - "包含版本号"
      - "包含发布日期"
      - "包含 release/repo 链接"
      - "包含发布关键词（发布|release|GA|open-source|开源|上线|推出）"
    extract:
      - entity_name
      - entity_type
      - url
      - version_or_date

  - name: "有深度"
    intent: quality_outlier
    must:
      - "长度 > 300 字"
    any_of:
      - "有小标题/列表结构"
      - "包含代码块"
      - "包含数据/图表"
      - "包含原理分析词（原理|源码|复盘|设计|架构|why|tradeoff）"
    extract:
      - key_takeaways
      - scope

  - name: "可行动"
    intent: actionable
    must:
      - "提到具体工具/方法名称"
    any_of:
      - "包含步骤说明"
      - "包含命令/代码"
      - "包含可访问链接"
    extract:
      - steps_summary
      - required_tools
      - url

  - name: "值得关注"
    intent: important_change
    must:
      - "涉及具体公司/组织/产品"
    any_of:
      - "有官方来源链接"
      - "包含政策/安全/事故相关词（政策|监管|下架|封禁|漏洞|CVE|事故|裁员|合并）"
      - "包含具体数字（金额/人数/百分比）"
    extract:
      - affected_area
      - source_url

  - name: "有洞察"
    intent: novel_stance
    must:
      - "提出明确主张/观点"
    any_of:
      - "有理由或证据支持"
      - "与常见观点不同"
      - "包含预测或判断"
      - "包含关键词（反直觉|非共识|我认为|被忽略|真正原因）"
    extract:
      - claim
      - reasons

  - name: "周刊/推荐列表"
    intent: aggregation
    must:
      - "包含多个推荐项（工具/文章/项目）"
    any_of:
      - "标题含有周刊/weekly/digest/roundup"
      - "包含列表结构"
      - "每个项目有独立链接"
    action: extract_items  # 特殊动作：拆解
    extract:
      - items:
          - name
          - type
          - url
          - description
```

### 6.3 判断逻辑

```
must 全部满足？
    │
    ├─ 否 → 不通过
    │
    └─ 是 → any_of 至少满足一条？
                │
                ├─ 否 → 不通过
                │
                └─ 是 → 通过，提取 extract 字段
```

---

## 7. 配置文件结构

```yaml
# config.yaml

# ===== AI 配置 =====
ai:
  providers:
    deepseek:
      baseUrl: https://api.deepseek.com/v1
      apiKey: ${DEEPSEEK_API_KEY}

    anthropic:
      apiKey: ${ANTHROPIC_API_KEY}

  tasks:
    analyze:
      provider: deepseek
      model: deepseek-chat
    classify:
      provider: deepseek
      model: deepseek-chat

# ===== 信息源 =====
sources:
  - name: "Elon Musk"
    type: twitter
    enabled: true
    fetchInterval: 300
    config:
      username: elonmusk

  - name: "Hacker News"
    type: rss
    fetchInterval: 600
    config:
      url: https://hnrss.org/frontpage

  - name: "阮一峰周刊"
    type: rss
    fetchInterval: 3600
    config:
      url: https://www.ruanyifeng.com/blog/atom.xml

  - name: "V2EX 热门"
    type: v2ex
    fetchInterval: 600
    config:
      node: hot

# ===== 标签定义 =====
tags:
  - name: "AI/技术"
    description: "AI 工具、技术文章、开源项目"

  - name: "好物推荐"
    description: "工具、软件、硬件推荐"

  - name: "宏观财经"
    description: "影响 BTC、股市的经济政策、国际事件"

  - name: "热点讨论"
    description: "社区热议话题"

# ===== 推送配置 =====
notifier:
  destinations:
    telegram:
      botToken: ${TG_BOT_TOKEN}
      chatId: ${TG_CHAT_ID}

    email:
      smtp:
        host: smtp.example.com
        port: 587
        user: ${SMTP_USER}
        pass: ${SMTP_PASS}
      to: xxx@example.com

  rules:
    - match: { pattern: [新发布, 可行动] }
      mode: realtime
      destinations: [telegram]

    - match: { pattern: [有深度, 值得关注, 有洞察] }
      mode: daily
      time: "08:00"
      destinations: [telegram]

# ===== 调度配置 =====
scheduler:
  timezone: Asia/Shanghai
```

---

## 8. 依赖包列表

### 核心框架
| 包名 | 用途 |
|------|------|
| `typescript` | 类型支持 |
| `tsx` | 开发时运行 TS |
| `fastify` | API 框架 |
| `turbo` | Monorepo 构建 |
| `@biomejs/biome` | Lint + Format |

### 数据库
| 包名 | 用途 |
|------|------|
| `drizzle-orm` | ORM |
| `drizzle-kit` | 迁移工具 |
| `postgres` | PostgreSQL 驱动 |

### 任务队列
| 包名 | 用途 |
|------|------|
| `bullmq` | 任务队列 |
| `ioredis` | Redis 客户端 |

### AI 调用
| 包名 | 用途 |
|------|------|
| `ai` | Vercel AI SDK 核心 |
| `@ai-sdk/openai` | OpenAI 兼容（DeepSeek） |
| `@ai-sdk/anthropic` | Claude API |

### 采集器插件
| 包名 | 用途 |
|------|------|
| `twitter-api-v2` | Twitter 采集 |
| `rss-parser` | RSS 解析 |
| `cheerio` | HTML 解析（V2EX） |
| `undici` | HTTP 请求 |

### 推送插件
| 包名 | 用途 |
|------|------|
| `telegraf` | Telegram Bot |
| `nodemailer` | 邮件发送 |

### 工具类
| 包名 | 用途 |
|------|------|
| `zod` | 配置 & 数据验证 |
| `pino` | 日志 |
| `cron` | 定时任务表达式 |
| `dayjs` | 日期处理 |
| `nanoid` | ID 生成 |
| `yaml` | YAML 配置解析 |

### 未来 TUI
| 包名 | 用途 |
|------|------|
| `ink` | React CLI 框架 |
| `ink-table` | 表格展示 |

---

## 9. 初期 Collectors

- Twitter
- RSS
- V2EX

后续可扩展添加新的 Collector 插件。

---

## 10. 部署环境

- NAS / 家庭服务器
- 24/7 运行
- 可能有 GPU（用于本地模型，当前不使用）

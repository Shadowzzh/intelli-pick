# IntelliPick 前端数据展示规划

## 概述

本文档从**业务目标和用户价值**角度定义 IntelliPick 前端需要展示的数据，帮助用户快速发现有价值的资讯、追踪行业热点、深度理解内容。

---

## 1. 内容快速浏览与发现

### 业务目标

让用户在第一时间快速判断内容是否值得阅读，通过卡片式展示在有限空间内呈现最关键的信息。

### 需要展示的数据

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 标题 | `contents.title` | 快速了解内容主题，判断是否相关 |
| 摘要 | `contents.summary` | AI提炼的核心观点，帮助理解内容价值 |
| 来源标识 | `source.name`, `source.type` | 判断内容权威性和类型（RSS📰/Twitter🐦/V2EX💬） |
| 发布时间 | `contents.publishedAt` | 判断内容时效性 |
| 分类标签 | `contents.category` | 快速识别内容领域（技术/产品/行业等） |
| 关键实体 | `entities[].name` | 看到涉及的公司、产品、人物 |
| AI质量评分 | `filterResult.score` | 系统评估的内容质量，帮助优先排序 |
| 原文链接 | `contents.url` | 链接到原文进行深度阅读 |

### 数据来源

- **主表**: `contents`
- **关联**: `sources`, `entity_mentions`, `entities`

### 筛选维度（帮助用户发现目标内容）

| 筛选器 | 数据字段 | 业务价值 |
|--------|---------|---------|
| 按分类 | `contents.category` | 只看特定领域的内容 |
| 按数据源 | `contents.source_id` | 只看特定来源的内容 |
| 按标签 | `contents.tags[]` | 按技术栈或主题筛选 |
| 按时间 | `contents.publishedAt` | 只看最新内容 |

---

## 2. 内容深度理解与阅读

### 业务目标

当用户对某篇内容感兴趣时，提供完整的信息帮助用户深度理解内容，不仅仅是原文的简单复制，而是 AI 提炼的结构化知识。

### 需要展示的数据

#### 基础元信息

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 完整标题 | `contents.title` | 明确的主题 |
| 作者信息 | `contents.author` | 了解内容创作者 |
| 采集时间 | `contents.collectedAt` | 判断内容新鲜度 |
| AI评分详情 | `contents.filterResult` | 理解为什么内容被推荐 |

#### AI 提炼的结构化内容

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 内容摘要 | `contents.summary` | 快速掌握核心观点 |
| 关键要点 | `contents.keyPoints[]` | 条理化列出重要观点 |
| 数据点 | `contents.dataPoints[]` | 突出显示统计数据、数字等关键信息 |
| 内容类型 | `contents.contentType` | 了解是独立内容还是汇总合集 |

#### 多维度分类

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 一级分类 | `contents.category` | 主要领域分类 |
| 多维标签 | `contents.tags[]` | 技术栈、主题等细分分类 |

#### 相关实体

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 提及实体列表 | `entities[]` | 内容中讨论的公司、产品、人物 |
| 实体描述 | `entities[].description` | 了解这些实体的背景 |
| 实体链接 | `entities[].url` | 深入了解实体的入口 |

### 数据来源

- **主表**: `contents`
- **关联**: `sources`, `entity_mentions`, `entities`

---

## 3. 热点追踪与趋势分析

### 业务目标

帮助用户了解当前行业热点，发现正在被频繁讨论的实体（产品、公司、技术），追踪趋势变化。

### 需要展示的数据

#### 实体热度统计

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 实体名称 | `entities.name` | 识别热点实体 |
| 实体类型 | `entities.type` | 区分是产品/公司/人/工具等 |
| 提及次数 | `entities.mentionCount` | 量化热度 |
| 最后活跃时间 | `entities.lastMentionedAt` | 判断是否仍在活跃讨论 |
| 首次出现时间 | `entities.firstMentionedAt` | 判断是新热点还是长期热点 |

#### 实体详情与趋势

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 实体描述 | `entities.description` | 了解实体是什么 |
| 官方链接 | `entities.url` | 访问实体官网/主页 |
| 元数据 | `entities.metadata` | 额外信息（如 GitHub stars、版本号） |
| 活跃天数 | 计算字段 | `lastMentionedAt - firstMentionedAt`，判断持续热度 |

#### 实体的相关内容

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 提及上下文 | `entity_mentions.context` | 看到实体在内容中被如何讨论 |
| 相关内容列表 | `contents[]` | 查看所有提及该实体的内容 |
| 提及时间 | `entity_mentions.mentionedAt` | 时间线展示趋势 |

### 排序与发现维度

| 排序方式 | 数据字段 | 业务价值 |
|---------|---------|---------|
| 按热度 | `mentionCount DESC` | 看最热门的实体 |
| 按最新 | `lastMentionedAt DESC` | 看正在被讨论的实体 |
| 按趋势 | 计算字段 | 发现热度上升快的实体 |

### 数据来源

- **主表**: `entities`
- **关联**: `entity_mentions`, `contents`

---

## 4. 主题探索与分类导航

### 业务目标

让用户按主题和兴趣探索内容，而不是按时间顺序被动接收。通过分类和标签的组织方式，帮助用户发现特定领域的内容。

### 需要展示的数据

#### 主要分类（Category）导航

| 数据项 | 数据来源 | 为什么需要 |
|--------|---------|---------|
| 分类名称 | `contents.category` | 聚合所有唯一分类 |
| 内容数量 | COUNT(*) | 了解该分类的内容丰富度 |
| 最新更新 | MAX(`publishedAt`) | 判断分类是否活跃 |

#### 标签（Tags）云

| 数据项 | 数据来源 | 为什么需要 |
|--------|---------|---------|
| 标签名称 | `contents.tags[]` | 聚合所有唯一标签 |
| 使用频率 | COUNT(*) | 识别热门标签 |
| 标签描述 | `tags.description` | 理解标签含义 |

#### 分类下的内容

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 内容列表 | `contents[]` | 某个分类下的所有内容 |
| 分类统计 | 聚合查询 | 内容数量、时间分布 |

### 数据来源

- **主表**: `contents`, `tags`
- **聚合**: GROUP BY 查询

---

## 5. 精准搜索与检索

### 业务目标

当用户有明确的信息需求时，能够快速找到相关内容，支持关键词搜索和多维度筛选。

### 搜索范围（需要索引的字段）

| 搜索字段 | 数据库字段 | 权重 | 为什么搜索 |
|---------|-----------|------|-----------|
| 标题 | `contents.title` | 高 | 标题匹配通常最相关 |
| 摘要 | `contents.summary` | 中 | 内容核心观点 |
| 关键要点 | `contents.keyPoints[]` | 中 | 结构化要点 |
| 标签 | `contents.tags[]` | 中 | 主题相关度 |
| 作者 | `contents.author` | 低 | 按作者查找 |
| 实体名称 | `entities.name` | 低 | 按涉及的公司/产品查找 |

### 搜索结果展示

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 匹配的标题 | `contents.title` | 高亮显示关键词 |
| 匹配的摘要 | `contents.summary` | 高亮显示关键词 |
| 匹配字段 | - | 告知用户匹配了哪些字段 |
| 相关性得分 | - | 帮助用户判断结果相关度 |
| 发布时间 | `contents.publishedAt` | 判断时效性 |
| 分类和标签 | `contents.category`, `contents.tags[]` | 快速筛选 |

### 搜索后筛选

| 筛选器 | 数据字段 | 业务价值 |
|--------|---------|---------|
| 按分类筛选 | `contents.category` | 缩小搜索范围到特定领域 |
| 按时间筛选 | `contents.publishedAt` | 只看最近的内容 |
| 按来源筛选 | `contents.source_id` | 只看可信来源 |
| 按实体筛选 | `entities[]` | 只看涉及特定实体的内容 |

### 数据来源

- **主表**: `contents`
- **关联**: `entities`, `sources`
- **技术**: PostgreSQL 全文搜索或外部搜索引擎

---

## 6. 系统监控与管理

### 业务目标

让系统管理员能够监控采集系统的健康状态，管理数据源配置，查看系统运行指标。

### 需要展示的数据

#### 系统整体统计

| 数据项 | 计算方式 | 为什么需要 |
|--------|---------|---------|
| 总内容数 | COUNT(`contents.id`) | 了解系统规模 |
| 今日新增 | COUNT(`contents.id`) WHERE `publishedAt` > today | 判断系统活跃度 |
| 总实体数 | COUNT(`entities.id`) | 知识图谱规模 |
| 活跃数据源 | COUNT(`sources.id`) WHERE `enabled=true` | 采集覆盖面 |

#### 数据源健康度

| 数据项 | 数据库字段 | 为什么需要 |
|--------|-----------|-----------|
| 数据源名称 | `sources.name` | 识别数据源 |
| 启用状态 | `sources.enabled` | 是否在运行 |
| 采集间隔 | `sources.fetchInterval` | 配置的采集频率 |
| 最后采集时间 | `sources.lastFetchedAt` | 判断是否正常工作 |
| 采集状态 | 计算字段 | 健康/延迟/故障（基于时间差判断） |

#### 分类和实体统计

| 数据项 | 数据来源 | 为什么需要 |
|--------|---------|---------|
| 热门分类 | `contents.category` GROUP BY | 了解内容分布 |
| 热门实体 | `entities` ORDER BY `mentionCount` | 发现热点 |

### 数据来源

- **表**: `contents`, `entities`, `sources`
- **聚合**: 统计查询

---

## 7. 实时更新（可选功能）

### 业务目标

让用户能够实时看到新内容推送，无需手动刷新页面。

### 需要推送的数据

| 事件 | 推送数据 | 触发条件 | 业务价值 |
|-----|---------|---------|---------|
| 新内容到达 | Content 对象 | 新内容通过过滤管道 | 即时发现有价值内容 |
| 批量更新 | Content[] | 每分钟汇总 | 减少频繁推送 |
| 热点提醒 | Entity 对象 | 实体热度显著上升 | 发现突发热点 |
| 统计更新 | 统计数据 | 统计指标变化 | 了解系统动态 |

### 技术实现

- **协议**: Socket.IO
- **数据来源**: Worker 完成处理后推送

---

## 数据结构汇总

### Content 对象（内容）

```typescript
interface Content {
  // 基础信息
  id: string;
  title: string;
  summary: string;
  url: string;
  author?: string;
  publishedAt: string;
  collectedAt: string;

  // AI 分类
  category?: string;
  tags: string[];
  contentType?: string;

  // AI 提炼
  keyPoints?: string[];
  dataPoints?: string[];

  // 来源信息
  source: {
    id: string;
    name: string;
    type: string;  // rss/twitter/v2ex
  };

  // 关联实体
  entities: Entity[];

  // 过滤结果
  filterResult?: {
    score: number;
    reason?: string;
  };
}
```

### Entity 对象（实体）

```typescript
interface Entity {
  // 基础信息
  id: string;
  name: string;
  type: string;  // tool/project/library/article/person/company
  description?: string;
  url?: string;

  // 统计信息
  mentionCount: number;
  firstMentionedAt: string;
  lastMentionedAt: string;

  // 额外信息
  metadata?: Record<string, any>;
}
```

### Source 对象（数据源）

```typescript
interface Source {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  fetchInterval: number;  // 秒
  lastFetchedAt?: string;
  config: Record<string, any>;
}
```

---

## 实现优先级

### P0 - 核心业务（必须实现）

**价值**: 用户能够快速浏览和发现有价值的内容

- ✅ 内容快速浏览（标题、摘要、来源、时间）
- ✅ 基础筛选（按分类、数据源）
- 🔲 内容深度理解（详情页：摘要、要点、数据点、实体）
- 🔲 主题探索（分类导航、标签云）

### P1 - 增强体验（重要功能）

**价值**: 提升内容发现效率，追踪热点趋势

- 🔲 热点追踪（实体列表、热度统计）
- 🔲 精准搜索（全文搜索、多维度筛选）
- 🔲 实体详情（相关内容、趋势分析）

### P2 - 管理功能（可选）

**价值**: 系统管理和运维

- 🔲 系统监控（统计仪表板、数据源健康度）
- 🔲 实时更新（Socket.IO 推送）

---

## 技术要点

### 性能优化

- **分页加载**: 所有列表支持分页或无限滚动
- **索引优化**: 为搜索字段（title, summary, tags）建立索引
- **缓存策略**: 热门数据（分类、热门实体）缓存
- **懒加载**: 详情页的非关键数据（相关内容）按需加载

### 用户体验

- **相对时间**: "2小时前" 比 "2024-01-09 14:30" 更直观
- **高亮显示**: 搜索结果中关键词高亮
- **快速筛选**: 可点击的标签、实体、分类
- **响应式**: 移动端优先设计

### 数据完整性

- **空值处理**: 所有可选字段需要有合理的默认展示
- **数据验证**: 前端展示前验证数据完整性
- **错误处理**: 加载失败时的友好提示

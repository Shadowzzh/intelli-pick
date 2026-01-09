# 前端数据展示规划

## 概述

本文档定义 IntelliPick 前端需要展示的数据字段和展示方式。

---

## 1. 内容列表页

### 数据来源
- **表**: `contents`
- **关联**: `sources`, `entity_mentions`, `entities`

### 展示字段

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 内容ID | `id` | 隐藏 | 用于路由和详情查询 |
| 标题 | `title` | 主标题 | 2行截断 |
| 摘要 | `summary` | 描述文本 | 2行截断，灰色小字 |
| 原文链接 | `url` | 链接按钮 | 点击跳转原文 |
| 来源图标 | `source.type` | 图标 | RSS📰 / Twitter🐦 / V2EX💬 |
| 来源名称 | `source.name` | 文本 | 显示数据源名称 |
| 发布时间 | `publishedAt` | 相对时间 | "2小时前" 格式 |
| AI评分 | `filterResult.score` | 徽章 | ⭐ 8.5，可选显示 |
| 分类 | `category` | 徽章 | 一级分类标签 |
| 标签 | `tags` | 徽章组 | 显示前3个，剩余显示"+N" |
| 实体列表 | `entities[]` | 徽章组 | 显示前3个实体名称 |
| 作者 | `author` | 小文本 | 可选显示 |

### 筛选器支持

- **按分类**: `category` 字段的所有唯一值
- **按数据源**: `source.name` 字段的所有唯一值
- **按标签**: `tags` 数组中的所有唯一值

---

## 2. 内容详情页

### 数据来源
- **表**: `contents` + `sources` + `entity_mentions` + `entities`

### 展示字段

#### 基础信息区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 标题 | `title` | H1标题 | 主要标题 |
| AI评分 | `filterResult.score` | 评分卡片 | 大号显示评分 |
| 分类 | `category` | 分类徽章 | 主要分类 |
| 作者 | `author` | 作者信息 | 显示作者名称 |
| 来源 | `source.name` | 来源信息 | 带 `source.type` 图标 |
| 发布时间 | `publishedAt` | 完整时间 | "2024-01-09 14:30" |
| 采集时间 | `collectedAt` | 小字提示 | "采集于 2小时前" |
| 原文链接 | `url` | 按钮 | "查看原文" |

#### 内容摘要区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 摘要 | `summary` | 段落文本 | AI提炼的核心观点 |

#### 关键要点区（可折叠）

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 关键要点 | `keyPoints[]` | 无序列表 | 数组中的每项为一个要点 |

#### 数据点区（突出显示）

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 数据点 | `dataPoints[]` | 卡片组 | 统计数据、数字等 |

#### 标签区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 标签列表 | `tags[]` | 可点击徽章 | 点击可筛选同类内容 |

#### 提及实体区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 实体列表 | `entities[]` | 卡片列表 | 显示实体名称、类型、描述 |
| 实体链接 | `entities[].url` | 链接 | 跳转到实体详情 |

---

## 3. 实体列表页

### 数据来源
- **表**: `entities`

### 展示字段

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 实体ID | `id` | 隐藏 | 用于路由 |
| 实体名称 | `name` | 主标题 | 实体名称 |
| 实体类型 | `type` | 类型徽章 | tool/project/library/article/person/company |
| 提及次数 | `mentionCount` | 计数徽章 | "123 次提及" |
| 最后活跃 | `lastMentionedAt` | 相对时间 | "2小时前" |
| 描述 | `description` | 描述文本 | 1行截断 |

### 排序支持

- **按热度**: `mentionCount DESC`
- **按最新**: `lastMentionedAt DESC`
- **按最早**: `firstMentionedAt ASC`

---

## 4. 实体详情页

### 数据来源
- **表**: `entities` + `entity_mentions` + `contents`

### 展示字段

#### 基础信息区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 实体名称 | `name` | H1标题 | 实体名称 |
| 实体类型 | `type` | 类型徽章 | 带图标 |
| 描述 | `description` | 描述文本 | AI提取的描述 |
| 官方链接 | `url` | 链接按钮 | "访问官网" |

#### 统计信息区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 提及次数 | `mentionCount` | 大号数字 | 总计提及次数 |
| 首次提及 | `firstMentionedAt` | 完整日期 | "首次提及于 2024-01-01" |
| 最后提及 | `lastMentionedAt` | 相对时间 | "最后提及 2小时前" |
| 活跃天数 | 计算值 | 统计 | `lastMentionedAt - firstMentionedAt` |

#### 元数据区（可选）

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 元数据 | `metadata` | 键值对列表 | 如 GitHub stars、版本号 |

#### 相关内容区

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 提及上下文 | `entity_mentions.context` | 引用块 | 显示实体在内容中的提及上下文 |
| 相关内容 | `contents[]` | 内容卡片列表 | 时间倒序，包含标题、摘要、提及时间 |

---

## 5. 分类浏览页

### 数据来源
- **聚合查询**: `contents` 表的 `category` 和 `tags` 字段

### 展示字段

#### 主要分类区（Category）

| 字段名 | 数据来源 | 展示形式 | 说明 |
|--------|---------|---------|------|
| 分类名称 | `category` | 大号卡片 | 一级分类 |
| 内容数量 | COUNT(*) | 计数徽章 | 该分类下的内容数 |
| 最新更新 | MAX(`publishedAt`) | 相对时间 | "最后更新 2小时前" |

#### 标签云区（Tags）

| 字段名 | 数据来源 | 展示形式 | 说明 |
|--------|---------|---------|------|
| 标签名称 | `tags` | 可点击标签 | 字体大小根据使用频率 |
| 使用次数 | COUNT(*) | 小字提示 | 该标签下的内容数 |

---

## 6. 数据源管理页

### 数据来源
- **表**: `sources`

### 展示字段

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 数据源ID | `id` | 隐藏 | 用于API操作 |
| 数据源名称 | `name` | 主标题 | 数据源名称 |
| 数据源类型 | `type` | 类型徽章 | RSS/Twitter/V2EX |
| 启用状态 | `enabled` | 开关 | Toggle开关 |
| 采集间隔 | `fetchInterval` | 时间显示 | "3600秒 (1小时)" |
| 最后采集 | `lastFetchedAt` | 相对时间 | "最后采集 10分钟前" |
| 创建时间 | `createdAt` | 小字 | 显示数据源创建时间 |
| 配置详情 | `config` | JSON查看器 | 开发者模式可见 |

---

## 7. 统计仪表板

### 数据来源
- **聚合查询**: 多表统计

### 展示字段

#### 统计卡片

| 指标名称 | 计算方式 | 展示形式 |
|---------|---------|---------|
| 总内容数 | COUNT(`contents.id`) | 大号数字 |
| 今日新增 | COUNT(`contents.id`) WHERE `publishedAt` > today | 大号数字 + 变化率 |
| 总实体数 | COUNT(`entities.id`) | 大号数字 |
| 活跃数据源 | COUNT(`sources.id`) WHERE `enabled=true` | 大号数字 |

#### 热门分类

| 字段名 | 数据来源 | 展示形式 |
|--------|---------|---------|
| 分类名称 | `category` | 排行榜 |
| 内容数量 | COUNT(*) | 计数 |

#### 热门实体（Top 10）

| 字段名 | 数据库字段 | 展示形式 |
|--------|-----------|---------|
| 实体名称 | `name` | 排行榜 |
| 提及次数 | `mentionCount` | 计数 |
| 类型 | `type` | 类型徽章 |

#### 数据源健康度

| 字段名 | 数据库字段 | 展示形式 |
|--------|-----------|---------|
| 数据源名称 | `name` | 列表 |
| 启用状态 | `enabled` | 状态指示 |
| 最后采集 | `lastFetchedAt` | 健康度指示（绿色/黄色/红色） |

---

## 8. 全文搜索

### 搜索范围

| 搜索字段 | 数据库字段 | 权重 |
|---------|-----------|------|
| 标题 | `title` | 高 |
| 摘要 | `summary` | 中 |
| 关键要点 | `keyPoints` | 中 |
| 标签 | `tags` | 中 |
| 作者 | `author` | 低 |
| 实体名称 | `entities.name` | 低 |

### 搜索结果展示

| 字段名 | 数据库字段 | 展示形式 | 说明 |
|--------|-----------|---------|------|
| 标题 | `title` | 高亮标题 | 搜索关键词高亮 |
| 摘要 | `summary` | 高亮摘要 | 搜索关键词高亮 |
| 匹配字段 | - | 徽章 | 显示匹配了哪些字段 |
| 相关性得分 | - | 评分 | 搜索相关性评分 |
| 发布时间 | `publishedAt` | 相对时间 | 时间排序 |
| 分类和标签 | `category`, `tags` | 徽章 | 快速筛选 |

### 搜索筛选器

- **按分类**: 搜索结果中 `category` 聚合
- **按时间**: `publishedAt` 时间范围
- **按数据源**: `source.name` 多选
- **按实体**: 搜索结果中关联的 `entities`

---

## 9. 实时更新（Socket.IO）

### 推送数据

| 事件名 | 数据结构 | 触发条件 |
|-------|---------|---------|
| `content:new` | Content对象 | 新内容通过过滤 |
| `content:batch` | Content[] | 批量新内容（每分钟） |
| `entity:hot` | Entity对象 | 实体热度显著上升 |
| `stats:update` | 统计数据 | 统计数据变化 |

---

## API 数据结构参考

### Content 对象

```typescript
interface Content {
  id: string;
  title: string;
  summary: string;
  url: string;
  author?: string;
  publishedAt: string;
  collectedAt: string;
  category?: string;
  tags: string[];
  keyPoints?: string[];
  dataPoints?: string[];
  contentType?: string;
  source: {
    id: string;
    name: string;
    type: string;
  };
  entities: Entity[];
  filterResult?: {
    score: number;
    reason?: string;
  };
}
```

### Entity 对象

```typescript
interface Entity {
  id: string;
  name: string;
  type: string;
  description?: string;
  url?: string;
  mentionCount: number;
  firstMentionedAt: string;
  lastMentionedAt: string;
  metadata?: Record<string, any>;
}
```

### Source 对象

```typescript
interface Source {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  fetchInterval: number;
  lastFetchedAt?: string;
  config: Record<string, any>;
}
```

---

## 优先级建议

### P0 - 必须实现
- ✅ 内容列表页（已有）
- ✅ 基础统计卡片（已有）
- 🔲 内容详情页
- 🔲 分类和标签筛选器

### P1 - 重要功能
- 🔲 实体列表和详情页
- 🔲 全文搜索
- 🔲 分类浏览页

### P2 - 增强功能
- 🔲 数据源管理页
- 🔲 高级统计图表
- 🔲 实时更新推送

---

## 备注

- 所有时间字段建议使用相对时间显示（"2小时前"），悬停时显示完整时间
- 所有列表页面建议支持分页或无限滚动
- 所有可点击的标签/实体/分类应该支持快速筛选
- 响应式设计：移动端优先，适配不同屏幕尺寸

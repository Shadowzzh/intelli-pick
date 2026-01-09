# IntelliPick API 需求文档

> 为前端 Page 1 内容主页提供所需的 API 接口

## 概述

本文档列出前端 Page 1 内容主页所需的所有 API 接口。部分接口已实现，部分接口需要新增。

**参考文档：** `docs/plans/2026-01-09-frontend-data-display.md`

---

## 已实现的 API

以下 API 已在 `apps/api/src/routes/v1/` 中实现，可以直接使用：

### 1. 内容列表

**接口：** `GET /api/v1/contents`

**功能：** 获取内容列表，支持分页和多维度筛选

**查询参数：**
```typescript
{
  page?: number;        // 页码，默认 1
  limit?: number;       // 每页数量，默认 20
  category?: string;    // 分类筛选
  tags?: string[];      // 标签筛选
  sourceId?: string;    // 数据源筛选
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "标题",
        "summary": "摘要",
        "url": "https://...",
        "author": "作者",
        "publishedAt": "2024-01-17T10:00:00Z",
        "collectedAt": "2024-01-17T11:00:00Z",
        "category": "技术",
        "tags": ["react", "frontend"],
        "sourceId": "uuid",
        "filterResult": {
          "score": 0.85,
          "reasons": ["高质量内容"]
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**状态：** ✅ 已实现

**前端使用位置：** ContentList widget

---

### 2. 内容详情

**接口：** `GET /api/v1/contents/:id`

**功能：** 获取单个内容的完整信息

**路径参数：**
- `id`: 内容 ID

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "标题",
    "summary": "摘要",
    "keyPoints": ["要点1", "要点2"],
    "dataPoints": [
      { "value": "100万", "context": "用户数" }
    ],
    "contentType": "article",
    "url": "https://...",
    "author": "作者",
    "publishedAt": "2024-01-17T10:00:00Z",
    "collectedAt": "2024-01-17T11:00:00Z",
    "category": "技术",
    "tags": ["react", "frontend"],
    "sourceId": "uuid",
    "entities": [...],
    "filterResult": {...}
  }
}
```

**状态：** ✅ 已实现

**前端使用位置：** ContentDetailCard、点击跳转详情页

---

### 3. 热门实体列表

**接口：** `GET /api/v1/entities`

**功能：** 获取热门实体列表（按热度排序）

**查询参数：**
```typescript
{
  page?: number;        // 页码，默认 1
  limit?: number;       // 每页数量，默认 20
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "React",
        "type": "technology",
        "description": "前端框架",
        "url": "https://react.dev",
        "mentionCount": 150,
        "lastMentionedAt": "2024-01-17T10:00:00Z",
        "firstMentionedAt": "2024-01-01T00:00:00Z",
        "metadata": {
          "stars": 220000,
          "language": "TypeScript"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

**状态：** ✅ 已实现

**前端使用位置：** TrendingEntitiesWidget

**⚠️ 需要增强：** 添加日期筛选参数，支持按指定日期查询实体热度

---

### 4. 搜索

**接口：** `POST /api/v1/search`

**功能：** 全文搜索内容

**请求体：**
```typescript
{
  query: string;        // 搜索关键词
  limit?: number;       // 结果数量，默认 20
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content": {...},      // 内容对象
        "score": 0.95,         // 相关性得分
        "matches": {
          "title": ["React"],
          "summary": ["组件"]
        }
      }
    ],
    "total": 25
  }
}
```

**状态：** ✅ 已实现

**前端使用位置：** Page 3 搜索页面（暂不实现）

---

### 5. 系统统计

**接口：** `GET /api/v1/stats`

**功能：** 获取系统整体统计数据

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalContents": 10000,
    "todayContents": 150,
    "totalEntities": 500,
    "activeSources": 12
  }
}
```

**状态：** ✅ 已实现

**前端使用位置：** 统计卡片、Page 4 管理后台（暂不实现）

---

## 需要新增的 API

以下接口需要后端开发者实现：

---

### 1. 有内容的日期列表

**接口：** `GET /api/v1/contents/dates`

**功能：** 获取指定时间范围内有内容的日期列表（用于日历 widget 高亮）

**查询参数：**
```typescript
{
  from?: string;  // 开始日期，ISO 8601 格式，默认本月第一天
  to?: string;    // 结束日期，ISO 8601 格式，默认本月最后一天
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "dates": [
      "2024-01-15",
      "2024-01-16",
      "2024-01-17"
    ],
    "counts": {
      "2024-01-15": 45,
      "2024-01-16": 52,
      "2024-01-17": 38
    }
  }
}
```

**用途：**
- CalendarWidget 高亮有内容的日期
- 显示每天的内容数量
- 支持日期范围查询

**实现要点：**
- 从 `contents` 表查询指定日期范围内的内容
- 按 `publishedAt` 日期分组统计
- 返回日期数组和对应的数量
- 使用索引优化查询性能（`publishedAt` 字段）

**优先级：** 🔴 高

---

### 2. 分类统计

**接口：** `GET /api/v1/categories/stats`

**功能：** 获取各分类的内容统计信息

**查询参数：**
```typescript
{
  date?: string;  // 指定日期，ISO 8601 格式
  from?: string;  // 日期范围开始
  to?: string;    // 日期范围结束
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "技术",
        "count": 1250,
        "latestUpdate": "2024-01-17T10:30:00Z"
      },
      {
        "name": "产品",
        "count": 856,
        "latestUpdate": "2024-01-17T09:15:00Z"
      },
      {
        "name": "行业",
        "count": 432,
        "latestUpdate": "2024-01-17T08:00:00Z"
      }
    ],
    "total": 2538
  }
}
```

**用途：**
- CategoryNav 显示各分类的内容数量
- 显示各分类的最新更新时间
- 支持按日期筛选统计

**实现要点：**
- 从 `contents` 表按 `category` 字段分组
- 支持日期范围筛选
- 统计每个分类的数量和最新更新时间
- 按数量降序排序

**优先级：** 🔴 高

---

### 3. 热门标签

**接口：** `GET /api/v1/tags/popular`

**功能：** 获取热门标签列表（按使用频率排序）

**查询参数：**
```typescript
{
  date?: string;  // 指定日期
  from?: string;  // 日期范围开始
  to?: string;    // 日期范围结束
  limit?: number; // 返回数量，默认 50
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "react",
        "count": 342,
        "description": "React 框架相关内容"
      },
      {
        "name": "ai",
        "count": 285,
        "description": "人工智能相关内容"
      },
      {
        "name": "typescript",
        "count": 231,
        "description": "TypeScript 相关内容"
      }
    ],
    "total": 1250
  }
}
```

**用途：**
- PopularTagsWidget 显示热门标签云
- TagFilter 提供标签筛选建议
- 显示标签使用频率

**实现要点：**
- 从 `contents` 表的 `tags` 数组字段提取所有标签
- 统计每个标签的出现次数
- 支持日期范围筛选
- 按使用频率降序排序
- 如果 `tags` 表有描述信息，join 查询

**数据库考虑：**
- 如果 `tags` 是 JSON 数组，使用 PostgreSQL 的 jsonb_array_elements_text
- 考虑添加标签关联表以优化查询性能

**优先级：** 🟡 中

---

### 4. 数据源健康状态

**接口：** `GET /api/v1/sources/health`

**功能：** 获取所有数据源的健康状态和采集状态

**查询参数：** 无

**响应示例：**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "uuid",
        "name": "TechCrunch RSS",
        "type": "rss",
        "enabled": true,
        "fetchInterval": 3600,
        "lastFetchedAt": "2024-01-17T10:30:00Z",
        "lastFetchStatus": "success",
        "healthStatus": "healthy",
        "nextFetchAt": "2024-01-17T11:30:00Z"
      },
      {
        "id": "uuid",
        "name": "Twitter Tech",
        "type": "twitter",
        "enabled": true,
        "fetchInterval": 1800,
        "lastFetchedAt": "2024-01-17T09:00:00Z",
        "lastFetchStatus": "success",
        "healthStatus": "delayed",
        "nextFetchAt": "2024-01-17T09:30:00Z"
      }
    ],
    "summary": {
      "total": 12,
      "healthy": 10,
      "delayed": 1,
      "error": 1,
      "disabled": 0
    }
  }
}
```

**健康状态判断逻辑：**
- `healthy`: 最后采集时间 < 1.5 × fetchInterval
- `delayed`: 最后采集时间 > 1.5 × fetchInterval 但 < 3 × fetchInterval
- `error`: 最后采集时间 > 3 × fetchInterval 或最后采集失败
- `disabled`: enabled = false

**用途：**
- Page 4 系统管理页面显示数据源状态
- 监控采集系统健康度
- 告警延迟或故障的数据源

**实现要点：**
- 从 `sources` 表查询所有数据源
- 根据 `lastFetchedAt` 和 `fetchInterval` 计算健康状态
- 返回详细的状态信息
- 计算汇总统计

**优先级：** 🟢 低（Page 4 暂不实现）

---

### 5. 实体的相关内容

**接口：** `GET /api/v1/entities/:id/contents`

**功能：** 获取提及某个实体的所有内容

**路径参数：**
- `id`: 实体 ID

**查询参数：**
```typescript
{
  page?: number;   // 页码
  limit?: number;  // 每页数量
  from?: string;   // 日期范围开始
  to?: string;     // 日期范围结束
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "uuid",
      "name": "React",
      "type": "technology"
    },
    "items": [
      {
        "id": "uuid",
        "title": "React 19 新特性解析",
        "summary": "摘要",
        "publishedAt": "2024-01-17T10:00:00Z",
        "context": "本文详细介绍了 React 19 的新特性..."
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

**用途：**
- 点击实体时查看相关内容
- 实体详情页展示
- 追踪实体的讨论趋势

**实现要点：**
- 通过 `entity_mentions` 表关联查询
- 包含提及上下文（如果有）
- 支持分页和日期筛选
- 按时间倒序排序

**优先级：** 🟡 中（实体详情功能）

---

### 6. 队列状态（可选）

**接口：** `GET /api/v1/queue/stats`

**功能：** 获取 BullMQ 队列状态统计

**响应示例：**
```json
{
  "success": true,
  "data": {
    "queues": [
      {
        "name": "content-processing",
        "waiting": 15,
        "active": 3,
        "completed": 15234,
        "failed": 23,
        "delayed": 0
      }
    ],
    "workers": {
      "active": 5,
      "total": 5
    }
  }
}
```

**用途：**
- Page 4 管理后台监控系统性能
- 监控队列积压情况
- 故障排查

**实现要点：**
- 使用 BullMQ 的 `getQueueMetrics()` 方法
- 查询各个队列的状态
- 查询 worker 状态

**优先级：** 🟢 低（Page 4 暂不实现）

---

## WebSocket 实时推送

使用 Socket.IO 实现实时数据推送。

### 连接

**URL：** `ws://localhost:3000`

**命名空间：** `/`

### 事件定义

#### 1. 新内容推送

**事件名：** `content:created`

**触发时机：** 新内容通过过滤管道并存储到数据库

**数据格式：**
```typescript
{
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: string;
  tags: string[];
  url: string;
}
```

**前端处理：**
- 显示"有新内容"提示
- 如果当前查看的日期匹配，自动刷新列表
- 更新相关统计数据

#### 2. 批量更新推送（可选）

**事件名：** `content:batch`

**触发时机：** 每分钟汇总一次新内容

**数据格式：**
```typescript
{
  count: number;
  contents: Content[];
  date: string;
}
```

#### 3. 实体热度更新（可选）

**事件名：** `entity:trending`

**触发时机：** 实体热度显著上升（如短时间内提及次数增加）

**数据格式：**
```typescript
{
  entity: {
    id: string;
    name: string;
    mentionCount: number;
  };
  trend: "up" | "down";
}
```

### 实现

后端参考已有实现：
- `apps/api/src/lib/socket.ts` - Socket.IO 配置
- `apps/web/src/lib/socket.ts` - 客户端连接
- `apps/web/src/hooks/useRealtime.ts` - 实时更新 hook

需要在 Worker 处理完成后推送事件。

---

## 通用规范

### 日期格式

所有日期使用 **ISO 8601** 格式：
```
2024-01-17T10:30:00Z
2024-01-17
```

### 分页参数

```typescript
{
  page?: number;   // 页码，从 1 开始
  limit?: number;  // 每页数量，默认 20，最大 100
}
```

### 响应格式

**成功响应：**
```json
{
  "success": true,
  "data": {...}
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### HTTP 状态码

- `200` - 成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器错误

---

## 优先级总结

### 🔴 高优先级（Page 1 必需）

1. `GET /api/v1/contents/dates` - 有内容的日期列表
2. `GET /api/v1/categories/stats` - 分类统计
3. 增强 `GET /api/v1/entities` 添加日期筛选参数
4. WebSocket `content:created` 事件实现

### 🟡 中优先级（增强体验）

5. `GET /api/v1/tags/popular` - 热门标签
6. `GET /api/v1/entities/:id/contents` - 实体的相关内容

### 🟢 低优先级（Page 4 管理后台）

7. `GET /api/v1/sources/health` - 数据源健康状态
8. `GET /api/v1/queue/stats` - 队列状态

---

## 数据库索引建议

为了优化查询性能，建议添加以下索引：

```sql
-- contents 表
CREATE INDEX idx_contents_published_at ON contents(published_at DESC);
CREATE INDEX idx_contents_category ON contents(category);
CREATE INDEX idx_contents_source_id ON contents(source_id);

-- entities 表
CREATE INDEX idx_entities_mention_count ON entities(mention_count DESC);
CREATE INDEX idx_entities_last_mentioned ON entities(last_mentioned_at DESC);

-- entity_mentions 表
CREATE INDEX idx_entity_mentions_entity_id ON entity_mentions(entity_id);
CREATE INDEX idx_entity_mentions_content_id ON entity_mentions(content_id);
```

---

## 后续沟通

如有疑问或需要澄清，请查看：
- 前端设计文档：`docs/plans/2026-01-09-frontend-data-display.md`
- API 路由实现：`apps/api/src/routes/v1/`
- 数据库 Schema：`packages/db/src/schema/`

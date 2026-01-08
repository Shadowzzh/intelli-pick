# IntelliPick API 文档

## 概述

IntelliPick 提供双 API 接口用于访问已过滤的内容和实体：
- **RESTful API** - 位于 `/api/v1/*` 的标准 HTTP 端点，返回 JSON 响应
- **GraphQL API** - 位于 `/graphql` 的灵活查询接口
- **AI Chat** - 位于 `/api/v1/ai/chat` 的自然语言接口

## 基础 URL

开发环境: `http://localhost:3000`

## 认证

当前无需认证（公开 API）

## RESTful API

### Contents

#### 列出内容

\`\`\`http
GET /api/v1/contents?page=1&limit=20&category=技术
\`\`\`

**查询参数：**
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20，最大 100
- `category` (可选): 内容分类过滤
- `tags` (可选): 标签过滤（数组）
- `sourceId` (可选): 数据源 ID 过滤

**响应：**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "内容标题",
      "summary": "内容摘要",
      "category": "技术",
      "tags": ["AI", "机器学习"],
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
\`\`\`

#### 获取单个内容

\`\`\`http
GET /api/v1/contents/:id
\`\`\`

**响应：**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "内容标题",
    "summary": "内容摘要",
    "rawContent": "完整内容...",
    "url": "https://example.com/article",
    "author": "作者名",
    "category": "技术",
    "tags": ["AI", "机器学习"],
    "keyPoints": ["关键点1", "关键点2"],
    "dataPoints": ["数据点1", "数据点2"],
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "collectedAt": "2024-01-01T01:00:00.000Z",
    "createdAt": "2024-01-01T02:00:00.000Z"
  }
}
\`\`\`

### Entities

#### 列出热门实体

\`\`\`http
GET /api/v1/entities?page=1&limit=20
\`\`\`

**查询参数：**
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20，最大 100

**响应：**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "xyz789",
      "name": "实体名称",
      "type": "tool",
      "url": "https://github.com/example",
      "description": "实体描述",
      "mentionCount": 42,
      "metadata": {},
      "firstMentionedAt": "2024-01-01T00:00:00.000Z",
      "lastMentionedAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
\`\`\`

#### 获取单个实体

\`\`\`http
GET /api/v1/entities/:id
\`\`\`

### Search

#### 全文搜索

\`\`\`http
POST /api/v1/search
Content-Type: application/json

{
  "query": "AI",
  "limit": 20
}
\`\`\`

**请求体：**
- `query` (必需): 搜索关键词
- `limit` (可选): 返回结果数量，默认 20

**响应：**
\`\`\`json
{
  "success": true,
  "data": {
    "contents": [
      {
        "id": "abc123",
        "title": "AI 技术文章",
        "summary": "关于 AI 的讨论",
        "rank": 20
      }
    ],
    "entities": [],
    "meta": {
      "totalContents": 5,
      "totalEntities": 0,
      "query": "AI"
    }
  }
}
\`\`\`

### AI Chat

#### 自然语言查询

\`\`\`http
POST /api/v1/ai/chat
Content-Type: application/json

{
  "message": "最近关于AI的热门文章有哪些？"
}
\`\`\`

**请求体：**
- `message` (必需): 自然语言问题

**响应：**
\`\`\`json
{
  "success": true,
  "data": {
    "response": "找到了5篇最近关于AI的热门文章...",
    "toolResults": [
      {
        "tool": "searchContents",
        "data": [...]
      }
    ]
  }
}
\`\`\`

## GraphQL API

端点: `POST /graphql`

### 示例查询

\`\`\`graphql
query {
  contents(limit: 10) {
    id
    title
    summary
    category
    tags
  }
}
\`\`\`

### 查询可用字段

**Content:**
- id, title, summary, rawContent, url, author
- category, tags, keyPoints, dataPoints
- publishedAt, collectedAt, createdAt

**Entity:**
- id, name, type, url, description
- mentionCount, metadata
- firstMentionedAt, lastMentionedAt

开发环境提供交互式 playground: `http://localhost:3000/graphql`

## 响应格式

### 成功响应

\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### 分页响应

\`\`\`json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
\`\`\`

### 错误响应

\`\`\`json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Content not found"
  }
}
\`\`\`

**错误码：**
- `NOT_FOUND` - 资源不存在
- `VALIDATION_ERROR` - 请求参数验证失败
- `INTERNAL_ERROR` - 服务器内部错误
- `UNAUTHORIZED` - 未授权（预留）
- `RATE_LIMIT_EXCEEDED` - 超出速率限制

## 健康检查

\`\`\`http
GET /health
\`\`\`

**响应：**
\`\`\`json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

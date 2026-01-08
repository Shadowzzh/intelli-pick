# API 使用示例

## RESTful API 示例

### 使用 curl

#### 获取最新内容

\`\`\`bash
curl http://localhost:3000/api/v1/contents
\`\`\`

#### 带过滤条件获取内容

\`\`\`bash
curl "http://localhost:3000/api/v1/contents?category=技术&tags=AI&limit=10"
\`\`\`

#### 搜索

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/search \\
  -H "Content-Type: application/json" \\
  -d '{"query":"机器学习","limit":5}'
\`\`\`

#### 获取热门实体

\`\`\`bash
curl http://localhost:3000/api/v1/entities?page=1&limit=20
\`\`\`

### 使用 JavaScript (fetch)

#### 获取内容

\`\`\`javascript
// 获取最新内容
const response = await fetch('http://localhost:3000/api/v1/contents?page=1&limit=20');
const result = await response.json();
console.log(result.data);

// 带过滤条件
const filtered = await fetch(
  'http://localhost:3000/api/v1/contents?category=技术&tags=AI'
);
const filteredResult = await filtered.json();
console.log(filteredResult.data);
\`\`\`

#### 搜索

\`\`\`javascript
const searchResponse = await fetch('http://localhost:3000/api/v1/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'AI', limit: 10 }),
});
const searchResult = await searchResponse.json();
console.log(searchResult.data.contents);
\`\`\`

#### 获取单个内容

\`\`\`javascript
const contentResponse = await fetch('http://localhost:3000/api/v1/contents/abc123');
const content = await contentResponse.json();

if (content.success) {
  console.log(content.data.title);
  console.log(content.data.summary);
} else {
  console.error('Error:', content.error.message);
}
\`\`\`

### 使用 Python (requests)

#### 获取内容

\`\`\`python
import requests

# 获取最新内容
response = requests.get('http://localhost:3000/api/v1/contents', params={
    'page': 1,
    'limit': 20,
    'category': '技术'
})
result = response.json()
print(result['data'])

# 搜索
search_response = requests.post('http://localhost:3000/api/v1/search', json={
    'query': 'AI',
    'limit': 10
})
search_result = search_response.json()
print(search_result['data']['contents'])
\`\`\`

## GraphQL 示例

### 基础查询

\`\`\`bash
curl -X POST http://localhost:3000/graphql \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { contents(limit: 5) { id title summary category } }"
  }'
\`\`\`

### 使用 JavaScript

\`\`\`javascript
const response = await fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: \`
      query {
        contents(limit: 10) {
          id
          title
          summary
          category
          tags
          publishedAt
        }
      }
    \`
  }),
});

const result = await response.json();
console.log(result.data.contents);
\`\`\`

### 查询多个类型

\`\`\`graphql
query {
  contents(limit: 5) {
    id
    title
    category
  }
  entities(limit: 10) {
    id
    name
    type
    mentionCount
  }
}
\`\`\`

## AI Chat 示例

### curl 示例

\`\`\`bash
# 询问最近的热门内容
curl -X POST http://localhost:3000/api/v1/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "最近一周最火的技术文章有哪些？"}'

# 搜索特定主题
curl -X POST http://localhost:3000/api/v1/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "帮我找一些关于React性能优化的内容"}'

# 查询热门实体
curl -X POST http://localhost:3000/api/v1/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "最近提到了哪些热门的开源项目？"}'
\`\`\`

### JavaScript 示例

\`\`\`javascript
async function askAI(message) {
  const response = await fetch('http://localhost:3000/api/v1/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('AI 回复:', result.data.response);
    if (result.data.toolResults) {
      console.log('使用工具:', result.data.toolResults);
    }
  } else {
    console.error('错误:', result.error.message);
  }
}

// 使用示例
await askAI('最近有哪些关于AI的文章？');
\`\`\`

## 完整工作流示例

### 场景：查找并分析 AI 相关内容

\`\`\`javascript
async function analyzeAIContent() {
  // 1. 搜索 AI 相关内容
  const searchResponse = await fetch('http://localhost:3000/api/v1/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '人工智能', limit: 10 }),
  });

  const searchResult = await searchResponse.json();
  console.log(\`找到 \${searchResult.data.contents.length} 篇相关内容\`);

  // 2. 获取详细内容
  const contentIds = searchResult.data.contents.slice(0, 3).map(c => c.id);
  for (const id of contentIds) {
    const contentResponse = await fetch(\`http://localhost:3000/api/v1/contents/\${id}\`);
    const content = await contentResponse.json();

    if (content.success) {
      console.log(\`标题: \${content.data.title}\`);
      console.log(\`摘要: \${content.data.summary}\`);
      console.log(\`关键点: \${content.data.keyPoints.join(', ')}\`);
      console.log('---');
    }
  }

  // 3. 获取热门实体
  const entitiesResponse = await fetch('http://localhost:3000/api/v1/entities?limit=10');
  const entities = await entitiesResponse.json();

  console.log('热门实体:');
  entities.data.forEach(entity => {
    console.log(\`- \${entity.name} (\${entity.type}), 提及 \${entity.mentionCount} 次\`);
  });
}

analyzeAIContent();
\`\`\`

## 错误处理示例

### JavaScript

\`\`\`javascript
async function fetchContent(id) {
  try {
    const response = await fetch(\`http://localhost:3000/api/v1/contents/\${id}\`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      // 处理业务错误
      switch (result.error.code) {
        case 'NOT_FOUND':
          console.error('内容不存在');
          break;
        case 'VALIDATION_ERROR':
          console.error('参数错误:', result.error.message);
          break;
        default:
          console.error('未知错误:', result.error.message);
      }
      return null;
    }
  } catch (error) {
    // 处理网络错误
    console.error('请求失败:', error);
    return null;
  }
}
\`\`\`

### Python

\`\`\`python
import requests

def fetch_content(content_id):
    try:
        response = requests.get(f'http://localhost:3000/api/v1/contents/{content_id}')
        result = response.json()

        if result['success']:
            return result['data']
        else:
            # 处理业务错误
            if result['error']['code'] == 'NOT_FOUND':
                print('内容不存在')
            elif result['error']['code'] == 'VALIDATION_ERROR':
                print(f'参数错误: {result["error"]["message"]}')
            else:
                print(f'未知错误: {result["error"]["message"]}')
            return None
    except requests.exceptions.RequestException as e:
        # 处理网络错误
        print(f'请求失败: {e}')
        return None
\`\`\`

## 环境变量配置

在使用 API 前，确保配置以下环境变量：

\`\`\`bash
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_filter

# DeepSeek API（用于 AI Chat）
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
AI_CHAT_MODEL=deepseek-chat

# API 配置
API_PORT=3000
API_HOST=0.0.0.0
API_CORS_ORIGIN=*
API_RATE_LIMIT=100

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true
\`\`\`

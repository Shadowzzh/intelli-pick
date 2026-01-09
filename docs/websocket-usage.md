# WebSocket 实时推送文档

本文档说明如何使用 WebSocket 实时接收新内容推送。

## 连接

**URL**: `ws://localhost:3000` (或配置的 API 地址)

**命名空间**: `/` (根命名空间)

## 事件

### content:created

当新内容通过过滤管道并存储到数据库时触发。

**数据格式**:
```typescript
{
  id: string;           // 内容 ID
  title?: string;       // 标题
  summary?: string;     // 摘要
  url?: string;         // 原始 URL
  publishedAt?: Date;   // 发布时间
  category?: string;    // 分类
  tags?: string[];      // 标签数组
}
```

**前端处理示例**:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('content:created', (content) => {
  console.log('新内容:', content);

  // 显示提示
  showNotification(`新内容: ${content.title}`);

  // 如果当前查看的日期匹配，自动刷新列表
  if (currentDate === new Date(content.publishedAt).toISOString().split('T')[0]) {
    refreshContentList();
  }

  // 更新统计数据
  updateStats();
});
```

### entity:updated

当实体被更新（提及次数增加）时触发。

**数据格式**:
```typescript
{
  id: string;
  name: string;
  type: string;
  mentionCount?: number;
  lastMentionedAt?: Date;
}
```

### stats:updated

当统计数据更新时触发。

**数据格式**:
```typescript
{
  totalContents?: number;
  todayNew?: number;
  totalEntities?: number;
}
```

## 房间 (Rooms)

客户端可以加入特定的房间来接收特定数据源的更新。

```typescript
// 加入数据源房间
socket.emit('join:source', 'source-id-here');

// 离开数据源房间
socket.emit('leave:source', 'source-id-here');
```

## 完整示例

```typescript
import { io } from 'socket.io-client';

class RealtimeService {
  private socket: any;

  connect() {
    this.socket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('已连接到 WebSocket');
    });

    this.socket.on('content:created', this.handleNewContent);
    this.socket.on('entity:updated', this.handleEntityUpdate);
    this.socket.on('stats:updated', this.handleStatsUpdate);

    this.socket.on('disconnect', () => {
      console.log('WebSocket 断开连接');
    });
  }

  private handleNewContent = (content: any) => {
    // 处理新内容
    console.log('收到新内容:', content);
    this.notifyNewContent(content);
  }

  private handleEntityUpdate = (entity: any) => {
    // 处理实体更新
    console.log('实体更新:', entity);
  }

  private handleStatsUpdate = (stats: any) => {
    // 处理统计更新
    console.log('统计更新:', stats);
  }

  joinSource(sourceId: string) {
    this.socket?.emit('join:source', sourceId);
  }

  leaveSource(sourceId: string) {
    this.socket?.emit('leave:source', sourceId);
  }

  disconnect() {
    this.socket?.disconnect();
  }

  private notifyNewContent(content: any) {
    // 显示浏览器通知
    if (Notification.permission === 'granted') {
      new Notification('新内容', {
        body: content.title,
        icon: '/icon.png'
      });
    }
  }
}

export const realtimeService = new RealtimeService();
```

## 注意事项

1. **向后兼容**: 系统同时支持 `content:new` 和 `content:created` 事件，前端可以使用任一名称
2. **重连机制**: Socket.IO 会自动重连，但建议添加自定义重连逻辑
3. **错误处理**: 监听 `error` 和 `disconnect` 事件以处理异常情况
4. **性能考虑**: 频繁的实时更新可能导致性能问题，建议添加节流/防抖逻辑

## 测试

可以使用 Socket.IO 客户端测试工具：

```bash
# 安装测试工具
npm install -g socket.io-client

# 连接并监听事件
node test-socket.js
```

**test-socket.js**:
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('已连接');
});

socket.on('content:created', (data) => {
  console.log('新内容:', data);
});

socket.on('disconnect', () => {
  console.log('已断开');
});
```

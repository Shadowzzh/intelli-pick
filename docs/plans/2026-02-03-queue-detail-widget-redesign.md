# QueueDetailWidget 重构设计文档

**日期**: 2026-02-03
**目标**: 重构队列详情组件，消除信息冗余，优化用户体验

---

## 问题分析

### 现状问题

当前 `QueueDetailWidget` 组件存在以下问题：

1. **信息冗余**: 顶部 3x2 状态卡片和 Tabs 上都显示相同的状态数量
2. **空间浪费**: 进度条、Worker 状态占用大量垂直空间，但用户关注度低
3. **交互效率低**: 需要切换 Tab 才能查看不同状态的任务，无法全局查看

### 用户需求

用户主要关注：**查看具体任务的详细信息**

次要需求：
- 快速筛选不同状态的任务
- 查看任务完整数据
- 操作任务（重试、删除等）

---

## 设计方案

### 核心设计原则

1. **减少信息冗余**: 移除重复的状态数字展示
2. **聚焦核心功能**: 突出任务列表，弱化辅助信息
3. **提升交互效率**: 筛选 + 表格 + 无限滚动，快速浏览所有任务

### 整体布局

```
┌────────────────────────────────────────────────────────────────┐
│ 队列详情                状态: [全部 ▼]              [default] │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 表头: ID │ 状态 │ 数据 │ 时间 │ 操作                      │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ 任务行 1                                                   │ │
│ │ 任务行 2                                                   │ │
│ │ 任务行 3                                                   │ │
│ │ ...                                                        │ │
│ │ 任务行 N                                                  │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ 🔄 加载中...                                               │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 组件层级结构

```
QueueDetailWidget
├── Widget 容器
│   ├── 标题栏
│   │   ├── 左侧: "队列详情" + Icon
│   │   ├── 右侧: 状态筛选器 Select
│   │   └── 最右侧: 队列名称 Badge
│   └── JobsTable (任务表格)
│       ├── TableHeader
│       ├── TableBody (任务列表)
│       ├── LoadMoreTrigger (滚动检测)
│       └── LoadingState / EmptyState
└── JobDetailDialog (点击行弹出)
```

---

## 详细设计

### 1. 状态筛选器

**位置**: 标题栏右侧
**组件**: shadcn `Select` 或自定义下拉菜单
**选项**:
- 全部
- 等待中
- 处理中
- 已完成
- 失败
- 延迟

**交互**:
- 初始状态: `all`
- 切换筛选: 重置页码，清空已加载数据，重新加载第一页

### 2. 表格列设计

| 列名 | 宽度 | 内容 | 说明 |
|------|------|------|------|
| 任务ID | 120px | `job.id` 或前8位 | 点击可复制完整ID |
| 状态 | 100px | 彩色徽章 | waiting/active/completed/failed/delayed |
| 数据摘要 | 自动 | `job.data` 的JSON预览 | 最多显示100字符，超出截断 |
| 创建时间 | 160px | `timestamp` 格式 | 如 "2026-02-03 14:30" |
| 操作 | 80px | [详情] 按钮 | 点击打开详情对话框 |

**状态徽章颜色映射**:
```typescript
waiting   → 蓝色 (bg-blue-500/10 text-blue-700)
active    → 橙色 (bg-orange-500/10 text-orange-700)
completed → 绿色 (bg-green-500/10 text-green-700)
failed    → 红色 (bg-red-500/10 text-red-700)
delayed   → 紫色 (bg-purple-500/10 text-purple-700)
```

### 3. 无限滚动加载

**实现方案**: `react-intersection-observer`

**加载触发**:
- 使用 `useInView` hook 监听底部元素
- 当底部元素进入视口 10% 时触发加载
- 判断 `hasMore` 和 `!isFetchingMore` 避免重复请求

**分页参数**:
- 每页 20 条数据
- 初始加载第 0 页
- 滚动到底部加载下一页

**加载状态**:
- **初始加载**: 表格显示骨架屏 (shadcn `Skeleton`)
- **加载更多**: 底部显示 `🔄 加载更多...`
- **没有更多**: 显示 `✅ 已加载全部任务`
- **空状态**: 显示 `暂无符合条件的任务`

**数据累加**:
```typescript
const [allJobs, setAllJobs] = useState<Job[]>([]);

useEffect(() => {
  if (jobs) {
    if (page === 0) {
      setAllJobs(jobs);  // 第一页，直接替换
    } else {
      setAllJobs(prev => [...prev, ...jobs]);  // 追加数据
    }
  }
}, [jobs, page]);
```

### 4. 任务详情对话框

**组件**: shadcn `Dialog`

**显示内容**:
- 完整的任务 JSON 数据
- 任务状态、创建时间、更新时间等元信息
- 操作按钮: 重试、删除、关闭

**触发方式**:
- 点击表格行任意位置
- 点击操作按钮

### 5. 表格交互

- **行悬停**: 高亮当前行，显示可点击状态
- **行点击**: 打开详情对话框
- **ID复制**: 点击任务ID列，复制完整ID到剪贴板，显示Toast提示
- **操作按钮**: 点击"详情"打开对话框，阻止事件冒泡

---

## 技术实现

### 依赖组件

**shadcn 组件**:
- `Dialog` - 详情对话框
- `Badge` - 状态徽章
- `Button` - 操作按钮
- `Skeleton` - 加载骨架屏
- `Select` - 状态筛选器（需添加）

**第三方库**:
- `react-intersection-observer` - 无限滚动触发

### 数据流

```typescript
const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
const [allJobs, setAllJobs] = useState<Job[]>([]);
const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
const [page, setPage] = useState(0);

const { data: jobs, isLoading, hasMore } = useQueueJobs(
  statusFilter === 'all' ? undefined : statusFilter,
  page,
  20  // pageSize
);

const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

useEffect(() => {
  if (inView && hasMore && !isLoading) {
    setPage(prev => prev + 1);
  }
}, [inView, hasMore, isLoading]);
```

### API 调用

**获取任务列表**:
```typescript
GET /api/v1/queue/jobs?status={status}&offset={offset}&limit={limit}
```

**获取任务详情**:
```typescript
GET /api/v1/queue/jobs/:jobId
```

**任务操作**:
```typescript
POST /api/v1/queue/jobs/:jobId/retry
DELETE /api/v1/queue/jobs/:jobId
```

---

## 实现步骤

1. **添加依赖**: 安装 `react-intersection-observer`
2. **添加 shadcn Select 组件** (如未安装)
3. **创建 `JobsTable` 组件**: 实现表格 UI 和无限滚动
4. **创建 `StatusFilterBar` 组件**: 状态筛选器
5. **重构 `QueueDetailWidget`**: 整合上述组件
6. **测试**: 测试筛选、滚动、对话框等交互
7. **移除旧代码**: 清理 Tabs、状态卡片等废弃代码

---

## 设计变更对比

### 移除的元素

- ❌ 3x2 状态卡片网格
- ❌ 处理进度条
- ❌ Worker 状态显示
- ❌ Tabs 组件

### 新增的元素

- ✅ 状态筛选器 (Select)
- ✅ 任务表格
- ✅ 无限滚动加载
- ✅ 任务详情对话框 (使用 shadcn Dialog)

### 保留的元素

- ✅ 队列名称 Badge
- ✅ Widget 容器
- ✅ JobCard 核心逻辑（改为表格行）

---

## 后续优化方向

1. **高级筛选**: 添加时间范围、搜索关键词等筛选条件
2. **批量操作**: 支持多选任务进行批量重试/删除
3. **实时更新**: WebSocket 推送新任务，自动刷新表格
4. **导出功能**: 导出任务列表为 CSV/JSON
5. **性能优化**: 虚拟滚动，处理大量数据场景

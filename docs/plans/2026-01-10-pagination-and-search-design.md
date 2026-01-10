# 分页和搜索功能设计方案

**日期**: 2026-01-10
**目标**: 为 ContentListNew 添加客户端搜索和传统分页功能

## 功能概述

### 1. 客户端搜索
- **范围**: 标题（title）和摘要（summary）字段
- **方式**: 实时过滤当前页的 20 条数据
- **位置**: Widget Header 的 actions 区域
- **性能**: debounce 300ms，避免频繁计算

### 2. 传统分页
- **控件**: 页码按钮（< 1 2 3 ... >）
- **位置**: Widget Footer 右侧，与统计信息并列
- **功能**: 首页、末页、上一页、下一页、页码跳转
- **显示**: 当前页高亮，智能显示页码（省略号）

## 架构设计

### 组件结构

```
ContentListNew
├── Widget
│   ├── Header
│   │   ├── Title + Icon
│   │   └── Actions
│   │       ├── SearchBox (新增)
│   │       └── ViewModeToggle
│   ├── Content
│   │   ├── FilterDisplay
│   │   └── ContentList (filteredItems)
│   └── Footer
│       ├── Stats (左侧)
│       └── Pagination (右侧, 新增)
```

### 状态管理

**在 `content-home-store.ts` 中添加**：
```typescript
interface ContentHomeState {
  // 现有字段...
  currentPage: number;
  searchQuery: string;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
}
```

## 组件实现

### 1. SearchBox 组件

**位置**: `apps/web/src/components/content/SearchBox.tsx`

**实现**：
```tsx
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "搜索标题或摘要..."
}: SearchBoxProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-48 px-2 text-sm border rounded-md
                   focus:ring-2 focus:ring-primary
                   placeholder:text-muted-foreground"
      />
    </div>
  );
}
```

### 2. Pagination 组件

**位置**: `apps/web/src/components/ui/Pagination.tsx`

**Props**：
```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}
```

**页码显示逻辑**：
- `totalPages ≤ 7`: 显示所有页码 `1 2 3 4 5 6 7`
- `totalPages > 7`: 智能省略
  - 靠近首页: `1 2 3 4 5 ... 10`
  - 靠近末页: `1 ... 6 7 8 9 10`
  - 中间位置: `1 ... 4 5 6 ... 10`

**按钮样式**：
- 尺寸: `h-8 px-3`
- 当前页: `bg-primary text-primary-foreground`
- 普通页: `hover:bg-muted`
- 禁用: `opacity-50 cursor-not-allowed`

### 3. ContentListNew 修改

**搜索过滤逻辑**：
```tsx
const filteredItems = useMemo(() => {
  if (!searchQuery) return items;

  const query = searchQuery.toLowerCase();
  return items.filter((item) =>
    item.title?.toLowerCase().includes(query) ||
    item.summary?.toLowerCase().includes(query)
  );
}, [items, searchQuery]);
```

**Header Actions**：
```tsx
<div className="flex items-center gap-2">
  <SearchBox
    value={searchQuery}
    onChange={setSearchQuery}
  />
  <ViewModeToggle />
</div>
```

**Footer 布局**：
```tsx
<footer
  className={cn(
    "widget-footer px-4 py-3 bg-card",
    "shrink-0",
    footerClassName
  )}
>
  <Divider className="mb-3" />
  <div className="flex items-center justify-between">
    <div className="text-sm text-muted-foreground">
      显示 {start} - {end} / {total} 条
    </div>
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  </div>
</footer>
```

## 数据流

### 分页流程

```
用户点击页码
  ↓
setCurrentPage(newPage)
  ↓
queryParams 更新 (page: newPage)
  ↓
useQuery queryKey 变化
  ↓
自动重新请求 API
  ↓
items 更新
  ↓
filteredItems 重新计算
```

### 搜索流程

```
用户输入关键词
  ↓
setSearchQuery(query)
  ↓
useMemo 检测 searchQuery 变化
  ↓
过滤当前页 items
  ↓
更新 filteredItems
  ↓
重新渲染列表
```

### 分页 + 搜索配合

- **方案 A**: 切换页码时清除搜索（简单）
- **方案 B**: 保留搜索状态跨页浏览（推荐）

推荐方案 B，实现：
```tsx
// 切换页码时保留搜索
const handlePageChange = (newPage: number) => {
  setCurrentPage(newPage);
  // searchQuery 保持不变
};
```

## 边界情况处理

### 1. 搜索结果为空
```tsx
{filteredItems.length === 0 && searchQuery && (
  <div className="text-center py-12">
    <p className="text-muted-foreground">没有找到匹配的内容</p>
    <p className="text-sm text-muted-foreground mt-2">
      试试调整搜索关键词
    </p>
  </div>
)}
```

### 2. 页码超出范围
- 点击 `<` 在第 1 页时：禁用
- 点击 `>` 在最后一页时：禁用
- 总页数为 0 或 1：隐藏分页控件

### 3. 网络错误
- 使用现有的 error handling
- 显示错误信息和重试按钮
- 不影响搜索功能

### 4. 加载状态
- 切换页码：显示 Loading
- 搜索过滤：无需 Loading（客户端操作）

## 响应式设计

### 搜索框
- 大屏幕（≥768px）: `w-48` 或 `w-64`
- 小屏幕（<768px）: `w-32` 或可折叠

### 分页控件
- 大屏幕: 完整显示所有页码
- 小屏幕: 简化显示 `1 ... 5 ... 10`
- 超小屏幕: 只显示 `< 当前页 >`

### Footer 布局
- 大屏幕: 左右并列
- 小屏幕: 上下堆叠（统计信息在上，分页在下）

## 实施步骤

1. **创建 Pagination 组件**
   - 文件: `apps/web/src/components/ui/Pagination.tsx`
   - 实现页码计算逻辑
   - 实现按钮渲染和事件处理

2. **创建 SearchBox 组件**
   - 文件: `apps/web/src/components/content/SearchBox.tsx`
   - 实现搜索输入框
   - 可选: 添加搜索图标

3. **更新 content-home-store**
   - 添加 `currentPage: number` (默认 1)
   - 添加 `searchQuery: string` (默认 "")
   - 添加 `setCurrentPage` action
   - 添加 `setSearchQuery` action

4. **修改 ContentListNew**
   - 搜索过滤逻辑 (useMemo)
   - Header actions 布局调整
   - Footer 集成 Pagination
   - 处理分页和搜索事件

5. **样式优化**
   - 搜索框样式和 focus 状态
   - 分页按钮样式
   - Footer 响应式布局

6. **测试**
   - 搜索功能测试（中文、英文、特殊字符）
   - 分页切换测试（首尾页、中间页）
   - 搜索 + 分页配合测试
   - 响应式布局测试（不同屏幕尺寸）
   - 边界情况测试（空结果、单页、错误）

## 性能优化

### 搜索优化
- 使用 `useMemo` 缓存过滤结果
- 考虑添加 debounce（300ms）避免频繁计算

### 分页优化
- 利用 `@tanstack/react-query` 的缓存机制
- 预加载相邻页面数据（可选）

### 渲染优化
- ContentListItem 使用 `React.memo`（可选）
- 避免不必要的重新渲染

## 技术栈

- **状态管理**: Zustand (useContentHomeStore)
- **数据获取**: @tanstack/react-query
- **UI**: Tailwind CSS 4
- **组件**: React 18
- **图标**: Lucide React

## 未来扩展

### 可选功能
1. **搜索历史**: 保存最近的搜索关键词
2. **搜索高亮**: 高亮显示匹配的文本
3. **键盘快捷键**: 方向键切换页码，Enter 聚焦搜索框
4. **URL 同步**: 将搜索和分页状态同步到 URL 参数
5. **服务端搜索**: 升级为全量搜索
6. **高级搜索**: 支持多字段、布尔运算符

### 性能提升
1. **虚拟滚动**: 如果单页数据量增大（>100条）
2. **无限滚动**: 替代传统分页（可选）
3. **预加载**: 预加载下一页数据

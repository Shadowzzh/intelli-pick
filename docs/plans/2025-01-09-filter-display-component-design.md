# FilterDisplay 组件设计文档

## 概述

创建一个独立的 `FilterDisplay` 组件，用于在内容列表页面展示当前应用的筛选条件，并支持单独清除每个筛选条件。

**日期**: 2025-01-09
**作者**: Claude Code
**状态**: 设计完成，待实现

## 需求

### 当前问题
- `ContentListNew.tsx` 中的筛选展示（第 77-94 行）过于简单
- 只显示筛选数量（如 "2 个标签"），不显示具体值
- 不支持单独清除筛选条件

### 目标
1. 详细显示所有筛选值（如：分类：财经、标签：上市公司、AI）
2. 使用紧凑文本样式（单行描述）
3. 支持单独清除每个筛选条件

## 设计

### 组件架构

#### 1. Store 扩展

**文件**: `apps/web/src/store/content-home-store.ts`

添加新的 action 方法：

```typescript
interface ContentHomeState {
  // ... 现有字段

  // 新增方法
  removeCategory: () => void;
  removeTag: (tag: string) => void;
  removeSourceId: (sourceId: string) => void;
}
```

**实现**:
```typescript
removeCategory: () =>
  set((state) => ({
    filters: { ...state.filters, category: undefined },
  })),

removeTag: (tagToRemove) =>
  set((state) => ({
    filters: {
      ...state.filters,
      tags: state.filters.tags?.filter((tag) => tag !== tagToRemove) || [],
    },
  })),

removeSourceId: (sourceIdToRemove) =>
  set((state) => ({
    filters: {
      ...state.filters,
      sourceIds: state.filters.sourceIds?.filter((id) => id !== sourceIdToRemove) || [],
    },
  })),
```

#### 2. FilterDisplay 组件

**文件**: `apps/web/src/components/content/FilterDisplay.tsx`

**Props 接口**:
```typescript
interface FilterDisplayProps {
  filters: ContentFilters;
  onRemoveCategory?: () => void;
  onRemoveTag?: (tag: string) => void;
  onRemoveSourceId?: (sourceId: string) => void;
  onClearAll?: () => void;
  className?: string;
}
```

**组件职责**:
1. 接收 filters 对象和回调函数
2. 将筛选条件格式化为紧凑文本
3. 每个筛选条件后面渲染 × 按钮
4. 提供"全部清除"按钮（可选）

### UI 设计

#### 视觉层次

**容器样式**:
- `flex items-center gap-2 flex-wrap` - 允许换行的弹性布局
- `text-sm text-muted-foreground` - 使用次要文本颜色
- `pb-3 border-b` - 底部分隔线，与内容区分

**筛选项样式**:
- 每个筛选条件用内联元素展示
- 使用 `×` (Unicode U+00D7) 作为清除按钮
- 清除按钮样式：`hover:text-destructive cursor-pointer ml-1`

**分隔符**:
- 多个筛选条件之间使用 `、`（中文顿号）+ 空格
- 最后一个条件后不加分隔符

**全部清除按钮**:
- 可选，放在最后
- 样式：`text-xs hover:text-destructive cursor-pointer`
- 文本：`[全部清除]`

#### 展示格式示例

```
分类：技术 ×，标签：AI ×、React ×，2 个数据源 × [全部清除]
```

**各种组合**:
- 无筛选：不显示组件
- 单个分类：`分类：财经 ×`
- 单个标签：`标签：上市公司 ×`
- 多个标签：`标签：上市公司、AI ×`
- 多个条件：用分隔符连接

### 数据流

```
用户点击 ×
  ↓
FilterDisplay 调用 onRemoveTag("AI")
  ↓
ContentListNew 传递的回调函数：store.removeTag("AI")
  ↓
Store 更新 filters.tags，移除 "AI"
  ↓
Zustand 触发订阅更新
  ↓
ContentListNew 重新渲染，传递新的 filters 给 FilterDisplay
  ↓
FilterDisplay 重新渲染，更新显示
  ↓
TanStack Query 检测到 queryParams 变化
  ↓
自动重新获取数据
```

### 集成到 ContentListNew

**文件**: `apps/web/src/components/content/ContentListNew.tsx`

替换第 77-94 行的筛选展示代码：

```typescript
const { filters, removeCategory, removeTag, removeSourceId, resetFilters } = useContentHomeStore();

// 在 Widget 内部，内容列表上方
<FilterDisplay
  filters={filters}
  onRemoveCategory={removeCategory}
  onRemoveTag={removeTag}
  onRemoveSourceId={removeSourceId}
  onClearAll={resetFilters}
  className="pb-2 border-b"
/>
```

## 错误处理与边界情况

### 1. 空筛选状态
```typescript
if (!filters.category &&
    (!filters.tags || filters.tags.length === 0) &&
    (!filters.sourceIds || filters.sourceIds.length === 0)) {
  return null; // 不渲染任何内容
}
```

### 2. 回调函数为空
```typescript
// 如果某些回调未提供，不渲染对应的清除按钮
{onRemoveTag && (
  <button onClick={onRemoveTag} className="cursor-pointer">×</button>
)}
```

### 3. 数组操作安全性
- `removeTag` 使用 `filter` 确保只移除指定标签
- `removeSourceId` 使用 `filter` 确保只移除指定数据源
- 操作后始终返回数组（即使是空数组）

### 4. 特殊字符处理
- 标签或分类名称中可能包含特殊字符，React 会自动转义 HTML

## 实现计划

### 步骤 1: 扩展 Store
- 修改 `apps/web/src/store/content-home-store.ts`
- 添加 `removeCategory`、`removeTag`、`removeSourceId` 方法
- 更新类型定义

### 步骤 2: 创建 FilterDisplay 组件
- 创建 `apps/web/src/components/content/FilterDisplay.tsx`
- 实现格式化逻辑
- 实现 UI 渲染
- 实现交互功能

### 步骤 3: 集成到 ContentListNew
- 修改 `apps/web/src/components/content/ContentListNew.tsx`
- 导入新组件
- 替换现有筛选展示代码（第 77-94 行）

### 步骤 4: 测试
- 应用多个筛选条件
- 逐个点击 ×，验证筛选条件正确移除
- 验证数据列表随之更新
- 点击全部清除，验证所有筛选被移除
- 测试边界情况（清除最后一个、清空所有筛选）

## 测试场景

### 手动测试清单

- [ ] 显示单个分类筛选
- [ ] 显示单个标签筛选
- [ ] 显示多个标签筛选
- [ ] 显示数据源筛选
- [ ] 显示混合筛选（分类 + 标签 + 数据源）
- [ ] 点击分类的 × 按钮，分类被移除
- [ ] 点击标签的 × 按钮，对应标签被移除
- [ ] 点击数据源的 × 按钮，对应数据源被移除
- [ ] 清除所有筛选后，组件不显示
- [ ] 点击"全部清除"按钮，所有筛选被移除
- [ ] 验证数据列表随筛选条件正确更新

## 性能考虑

- FilterDisplay 是纯展示组件，props 变化时才重新渲染
- 可以使用 `useMemo` 缓存格式化结果
- 如果性能测试显示需要，可以使用 `React.memo` 优化

## 未来优化方向

1. **显示数据源名称**: 调用 API 获取数据源列表，显示名称而不是 "X 个数据源"
2. **显示标签名称**: 目前已经显示标签名称，无需优化
3. **动画效果**: 添加清除动画，提升用户体验
4. **持久化**: 筛选条件已经通过 zustand persist 持久化

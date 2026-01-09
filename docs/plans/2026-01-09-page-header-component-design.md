# PageHeader 组件封装设计

## 概述

从 TestPage.tsx 中提取页面导航 Header 样式，封装为可复用的 PageHeader 组件，使其能够在使用 content-home-store 的页面中复用。

## 设计目标

1. 提取 TestPage.tsx (第 509-541 行) 的导航栏部分为独立组件
2. 保持完全相同的视觉效果和交互体验
3. 提供清晰的 API 接口
4. 支持在多个页面中复用

## 组件设计

### API 接口

```typescript
interface PageHeaderProps {
  pages: number[];                      // 页码数组，如 [1, 2, 3, 4]
  currentPage: number;                  // 当前选中的页码
  onPageChange: (page: number) => void; // 页码变化回调
  themeToggle?: React.ReactNode;        // 可选的主题切换组件
}
```

### 使用示例

```typescript
<PageHeader
  pages={[1, 2, 3, 4]}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  themeToggle={<ThemeToggle />}
/>
```

## 实现计划

### 任务 1: 创建 PageHeader 组件
**位置**: `apps/web/src/components/layout/PageHeader.tsx`

- 从 TestPage.tsx 提取 Header 相关代码 (第 509-541 行)
- 创建独立的函数组件
- 实现 Props 接口
- 保持所有样式类名不变
- 添加必要的注释

### 任务 2: 重构 TestPage.tsx
**位置**: `apps/web/src/pages/TestPage.tsx`

- 导入新创建的 PageHeader 组件
- 删除原有的 Header 代码 (第 509-541 行)
- 使用 PageHeader 组件替换
- 保持相同的 state 管理 (currentPage)
- 确保功能完全一致

### 任务 3: 在 ContentHome 页面使用 (可选)
**位置**: `apps/web/src/pages/ContentHome.tsx` 或相关页面

- 导入 PageHeader 组件
- 集成到页面布局中
- 可选：集成 content-home-store 的状态管理

### 任务 4: 验证和测试

- 运行 `pnpm typecheck` 确保类型正确
- 在浏览器中测试 TestPage 的视觉效果
- 测试页面切换交互
- 测试主题切换功能
- 确保响应式布局正常工作

## 技术细节

### 样式依赖

组件使用以下全局样式类（定义在 `apps/web/src/styles/globals.css`）:
- `widget` - Widget 容器样式
- `text-primary` - 主题色文字
- `text-foreground` - 前景色文字
- `text-muted-foreground` - 弱化前景色
- `border-primary` - 主题色边框
- `border-transparent` - 透明边框

### 组件结构

```
<div className="widget mb-6">
  <div className="flex items-center gap-6">
    {/* Logo - IntelliPick 标识 */}
    {/* Page Navigation - 页面切换标签 */}
    {/* Theme Toggle - 主题切换按钮 (ml-auto 右对齐) */}
  </div>
</div>
```

## 可选增强

### Store 扩展 (可选)

如果需要持久化当前 page 状态，可以在 `content-home-store.ts` 中添加:

```typescript
interface ContentHomeState {
  // 新增
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

// 在 partialize 中添加
partialize: (state) => ({
  filters: state.filters,
  currentPage: state.currentPage,
})
```

这样页面刷新后能保持用户最后访问的 page。

## 实现完成标准

- [x] PageHeader 组件创建完成
- [x] TestPage.tsx 重构完成并正常工作
- [x] 类型检查通过 (`pnpm typecheck`)
- [x] 视觉效果与原 TestPage 完全一致
- [x] 所有交互功能正常（页面切换、主题切换）
- [x] 代码通过 Biome 格式检查

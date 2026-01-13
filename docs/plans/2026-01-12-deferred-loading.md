# Deferred Loading 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现延迟显示 loading 动画功能，避免快速请求（< 100ms）时的 loading 闪烁，提升用户体验。

**Architecture:** 创建通用的 `useDeferredLoading` hook，接收 TanStack Query 的查询结果，使用 `useEffect` + `setTimeout` 实现状态延迟逻辑。在 `WidgetWithStates` 组件中集成此 hook，使所有 widgets 自动获得延迟 loading 能力。支持全局默认配置（100ms）和局部覆盖。

**Tech Stack:** React 18, TypeScript 5.7, TanStack Query 5, React Hooks (useState, useEffect)

---

## Task 1: 创建配置文件

**Files:**
- Create: `apps/web/src/config/loading.ts`

**Step 1: 创建配置目录**

Run:
```bash
mkdir -p apps/web/src/config
```

Expected: 目录创建成功，无输出

**Step 2: 编写配置文件**

Create `apps/web/src/config/loading.ts` with:

```typescript
/**
 * 延迟 loading 配置
 *
 * 用于避免快速请求时的 loading 闪烁
 * 如果请求在指定延迟时间内完成，则不显示 loading 状态
 */
export const DEFERRED_LOADING_CONFIG = {
  /**
   * 默认延迟时间（毫秒）
   *
   * 只有当 loading 状态持续超过此时间时，才会显示 loading UI
   *
   * @default 100
   */
  delay: 100,
} as const;

/**
 * useDeferredLoading hook 的配置选项
 */
export interface DeferredLoadingOptions {
  /**
   * 延迟时间（毫秒）
   *
   * 如果未指定，使用全局默认配置
   */
  delay?: number;
}
```

**Step 3: 验证类型检查**

Run:
```bash
cd apps/web && pnpm typecheck
```

Expected: 类型检查通过，无错误

**Step 4: Commit**

Run:
```bash
git add apps/web/src/config/loading.ts
git commit -m "feat(web): add deferred loading configuration

- Add DEFERRED_LOADING_CONFIG with default 100ms delay
- Add DeferredLoadingOptions interface
- Support global config with local override

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

Expected: Commit 成功

---

## Task 2: 创建 useDeferredLoading Hook

**Files:**
- Create: `apps/web/src/hooks/useDeferredLoading.ts`

**Step 1: 编写 hook 实现**

Create `apps/web/src/hooks/useDeferredLoading.ts` with:

```typescript
import { DEFERRED_LOADING_CONFIG, type DeferredLoadingOptions } from "@/config/loading";
import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * 延迟显示 loading 状态，避免快速请求时的闪烁
 *
 * @param query - TanStack Query 查询结果
 * @param options - 配置选项
 * @returns 包含延迟状态的查询结果
 *
 * @example
 * ```tsx
 * const query = useQuery({ ... });
 * const { isLoading, isFetching, data } = useDeferredLoading(query);
 *
 * if (isLoading) {
 *   return <Skeleton />;
 * }
 * ```
 */
export function useDeferredLoading<TData = unknown, TError = Error>(
  query: UseQueryResult<TData, TError>,
  options?: DeferredLoadingOptions
): UseQueryResult<TData, TError> {
  // 获取延迟时间，优先使用局部配置
  const delay = options?.delay ?? DEFERRED_LOADING_CONFIG.delay;

  // 初始化延迟状态，与真实状态保持一致
  const [deferredIsLoading, setDeferredIsLoading] = useState(query.isLoading);
  const [deferredIsFetching, setDeferredIsFetching] = useState(query.isFetching);

  // 处理 isLoading 状态延迟
  useEffect(() => {
    // 如果延迟为 0，禁用延迟功能
    if (delay <= 0) {
      setDeferredIsLoading(query.isLoading);
      return;
    }

    // 从 false → true: 延迟更新
    if (query.isLoading && !deferredIsLoading) {
      const timer = setTimeout(() => {
        setDeferredIsLoading(true);
      }, delay);

      // 清理定时器
      return () => clearTimeout(timer);
    }

    // 从 true → false: 立即更新
    if (!query.isLoading && deferredIsLoading) {
      setDeferredIsLoading(false);
    }
  }, [query.isLoading, deferredIsLoading, delay]);

  // 处理 isFetching 状态延迟
  useEffect(() => {
    // 如果延迟为 0，禁用延迟功能
    if (delay <= 0) {
      setDeferredIsFetching(query.isFetching);
      return;
    }

    // 从 false → true: 延迟更新
    if (query.isFetching && !deferredIsFetching) {
      const timer = setTimeout(() => {
        setDeferredIsFetching(true);
      }, delay);

      // 清理定时器
      return () => clearTimeout(timer);
    }

    // 从 true → false: 立即更新
    if (!query.isFetching && deferredIsFetching) {
      setDeferredIsFetching(false);
    }
  }, [query.isFetching, deferredIsFetching, delay]);

  // 返回新的查询结果，覆盖延迟状态
  return {
    ...query,
    isLoading: deferredIsLoading,
    isFetching: deferredIsFetching,
  };
}
```

**Step 2: 验证类型检查**

Run:
```bash
cd apps/web && pnpm typecheck
```

Expected: 类型检查通过，无错误

**Step 3: 验证代码风格**

Run:
```bash
cd apps/web && pnpm lint
```

Expected: 无 lint 错误

**Step 4: Commit**

Run:
```bash
git add apps/web/src/hooks/useDeferredLoading.ts
git commit -m "feat(web): implement useDeferredLoading hook

- Add hook to defer isLoading and isFetching states
- Support configurable delay with global default
- Implement immediate hide when loading completes
- Clean up timers on unmount and state changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

Expected: Commit 成功

---

## Task 3: 集成到 WidgetWithStates

**Files:**
- Modify: `apps/web/src/components/widgets/WidgetWithStates.tsx`

**Step 1: 添加导入**

在 `apps/web/src/components/widgets/WidgetWithStates.tsx` 文件顶部添加导入：

```typescript
import { useDeferredLoading } from "@/hooks/useDeferredLoading";
```

**Step 2: 在组件中应用 hook**

在 `WidgetWithStates` 函数组件的开头，添加 hook 调用：

找到这一行：
```typescript
export function WidgetWithStates<TData>({
	query,
	loading,
	empty,
	error,
	children,
	...widgetProps
}: WidgetWithStatesProps<TData>) {
```

在其后添加：
```typescript
	// 应用延迟 loading，避免快速请求时的闪烁
	const deferredQuery = useDeferredLoading(query);
```

**Step 3: 替换所有 query 引用为 deferredQuery**

将所有使用 `query.isLoading`、`query.isFetching`、`query.error`、`query.data` 的地方替换为 `deferredQuery`：

- 第 44 行附近: `if (query.isLoading)` → `if (deferredQuery.isLoading)`
- 第 62 行附近: `if (query.error)` → `if (deferredQuery.error)`
- 第 74 行: `error={query.error as Error}` → `error={deferredQuery.error as Error}`
- 第 75 行: `onRetry={() => query.refetch()}` → `onRetry={() => deferredQuery.refetch()}`
- 第 84 行: `const data = query.data;` → `const data = deferredQuery.data;`

**Step 4: 验证类型检查**

Run:
```bash
cd apps/web && pnpm typecheck
```

Expected: 类型检查通过，无错误

**Step 5: 验证代码风格**

Run:
```bash
cd apps/web && pnpm lint
```

Expected: 无 lint 错误

**Step 6: Commit**

Run:
```bash
git add apps/web/src/components/widgets/WidgetWithStates.tsx
git commit -m "feat(web): integrate deferred loading into WidgetWithStates

- Apply useDeferredLoading hook to all widgets
- Replace query references with deferredQuery
- Auto-enable for all existing widgets without code changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

Expected: Commit 成功

---

## Task 4: 验证功能

**Step 1: 启动开发服务器**

Run:
```bash
cd apps/web && pnpm dev
```

Expected: 开发服务器启动，监听端口（通常是 5173）

**Step 2: 手动测试快速请求**

1. 打开浏览器访问 `http://localhost:5173`
2. 打开浏览器开发者工具的 Network 面板
3. 设置网络速度为 "Fast 3G" 或不限制
4. 刷新页面
5. 观察 widgets 的 loading 状态

Expected 行为：
- 如果 API 响应时间 < 100ms，widgets 不应该显示 loading 骨架屏
- 如果 API 响应时间 > 100ms，widgets 应该显示 loading 骨架屏

**Step 3: 测试慢速请求**

1. 在 Network 面板中，设置网络速度为 "Slow 3G"
2. 刷新页面
3. 观察 widgets 的 loading 状态

Expected 行为：
- 所有 widgets 应该在 100ms 后显示 loading 骨架屏
- 数据加载完成后，loading 立即消失，显示内容

**Step 4: 检查控制台错误**

Expected: 无 React 错误或警告

**Step 5: 停止开发服务器**

Run: `Ctrl+C`

---

## Task 5: 文档更新

**Files:**
- Create: `docs/deferred-loading.md`

**Step 1: 创建使用文档**

Create `docs/deferred-loading.md` with:

```markdown
# Deferred Loading 使用指南

## 概述

Deferred Loading 是一个用于延迟显示 loading 状态的功能，主要用于避免快速请求时的 loading 闪烁，提升用户体验。

## 原理

当发起数据请求时，如果请求在很短的时间内（默认 100ms）完成，用户不会看到 loading 动画。只有当请求持续时间超过阈值时，才会显示 loading 状态。

这避免了以下问题：
- 快速请求时，loading 动画快速闪烁
- 页面出现"抖动"感
- 用户体验不流畅

## 使用方法

### 在 Widgets 中（自动启用）

所有使用 `WidgetWithStates` 的组件自动启用延迟 loading：

```tsx
import { WidgetWithStates } from "@/components/widgets";
import { useQuery } from "@tanstack/react-query";

export function MyWidget() {
  const query = useQuery({
    queryKey: ['myData'],
    queryFn: fetchMyData,
  });

  return (
    <WidgetWithStates query={query} title="我的小部件">
      {(data) => <div>{/* 渲染内容 */}</div>}
    </WidgetWithStates>
  );
}
```

✅ 自动应用 100ms 延迟

### 在其他组件中

```tsx
import { useDeferredLoading } from "@/hooks/useDeferredLoading";
import { useQuery } from "@tanstack/react-query";

export function MyComponent() {
  const query = useQuery({
    queryKey: ['myData'],
    queryFn: fetchMyData,
  });

  // 应用延迟 loading
  const { isLoading, data } = useDeferredLoading(query);

  if (isLoading) {
    return <Skeleton />;
  }

  return <div>{/* 渲染内容 */}</div>;
}
```

### 自定义延迟时间

```tsx
// 延迟 200ms
const { isLoading } = useDeferredLoading(query, { delay: 200 });

// 禁用延迟（立即显示 loading）
const { isLoading } = useDeferredLoading(query, { delay: 0 });
```

## 配置

### 全局配置

编辑 `apps/web/src/config/loading.ts`：

```typescript
export const DEFERRED_LOADING_CONFIG = {
  delay: 150, // 修改默认延迟为 150ms
} as const;
```

### 局部覆盖

通过 `options.delay` 参数覆盖全局配置：

```tsx
useDeferredLoading(query, { delay: 50 }) // 仅此处使用 50ms
```

## 适用场景

### ✅ 适合使用

- 用户交互频繁的列表、筛选器
- 后台自动刷新的数据
- 次要内容的加载（如侧边栏小部件）
- 预期响应时间快的 API（< 500ms）

### ❌ 不适合使用

- 关键操作的确认反馈（支付、删除等）
- 首次加载的主要内容
- 预期响应时间慢的 API（> 2s）
- 需要明确 loading 反馈的场景

## 最佳实践

### 延迟时间选择

- **100ms**（默认）：大多数场景的最佳平衡，用户几乎无法察觉
- **50-150ms**：适合快速 API
- **200ms+**：仅在数据源已知较慢时使用

### 禁用延迟的场景

```tsx
// 关键操作需要立即反馈
const deleteMutation = useMutation({ ... });
const { isPending } = useDeferredLoading(deleteMutation, { delay: 0 });
```

## 技术细节

### 状态处理

- **isLoading**: 首次加载状态（延迟）
- **isFetching**: 后台刷新状态（延迟）
- **error**: 错误状态（不延迟）
- **data**: 数据状态（不延迟）

### 边界情况

1. **快速请求**（< delay）：
   - 定时器未触发，loading 状态始终为 false
   - 用户无感知

2. **慢速请求**（> delay）：
   - 定时器触发，显示 loading
   - 请求完成后，loading 立即隐藏

3. **组件卸载**：
   - 自动清理定时器
   - 无内存泄漏

## 故障排查

### Loading 仍然闪烁

- 检查延迟时间是否过小
- 检查 API 响应时间是否稳定在阈值附近
- 考虑增加延迟时间

### Loading 显示太晚

- 减少延迟时间
- 或禁用延迟（delay: 0）

### 类型错误

确保导入正确的类型：

```typescript
import type { UseQueryResult } from "@tanstack/react-query";
```
```

**Step 2: Commit**

Run:
```bash
git add docs/deferred-loading.md
git commit -m "docs: add deferred loading usage guide

- Document core concepts and usage
- Add examples for widgets and components
- Provide configuration and best practices
- Include troubleshooting tips

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

Expected: Commit 成功

---

## 完成标准

所有任务完成后，应满足：

1. ✅ 配置文件已创建（`config/loading.ts`）
2. ✅ Hook 已实现（`hooks/useDeferredLoading.ts`）
3. ✅ 已集成到 `WidgetWithStates`
4. ✅ 所有现有 widgets 自动获得延迟 loading 能力
5. ✅ 类型检查通过
6. ✅ 代码风格检查通过
7. ✅ 手动测试验证功能正常
8. ✅ 文档已创建
9. ✅ 所有更改已提交到 git

## 后续优化（可选）

1. **添加单元测试**（使用 Vitest + React Testing Library）
2. **添加 Storybook 示例**
3. **支持 `minDisplayTime`**（loading 一旦显示，最少保持显示时间）
4. **添加 DevTools 支持**（显示延迟状态调试信息）

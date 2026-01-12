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

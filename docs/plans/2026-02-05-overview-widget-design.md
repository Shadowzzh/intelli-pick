# OverviewWidget 统一概览组件设计

**日期**: 2026-02-05
**状态**: 设计完成,待实施

## 概述

将监控页面顶部的 4 个独立指标卡片(总内容数、今日新增、队列任务、系统状态)整合到一个统一的 `OverviewWidget` 组件中,使用简洁数值风格,响应式适配所有设备。

## 组件架构

### 核心组件: `OverviewWidget`

**位置**: `apps/web/src/components/monitoring/OverviewWidget.tsx`

**职责**:
- 展示系统关键指标的统一概览
- 响应式适配不同屏幕尺寸
- 提供简洁的数值风格展示

**Props 接口**:
```typescript
interface OverviewWidgetProps {
  data?: {
    totalContents: number;
    todayNew: number;
    queueWaiting: number;
    queueActive: number;
    systemStatus: 'healthy' | 'warning' | 'error';
  };
  isLoading?: boolean;
}
```

**组件结构**:
- 使用单一的 Widget 容器
- 内部使用 Tailwind Grid 布局:
  - 桌面端(≥1024px): `grid grid-cols-4`
  - 平板端(768px-1023px): `md:grid-cols-2`
  - 移动端(<768px): `grid-cols-1`
- 间距: `gap-4`
- 每个指标使用统一的 `MetricItem` 子组件

### 子组件: `MetricItem`

**Props 接口**:
```typescript
interface MetricItemProps {
  label: string;          // 指标名称
  value: string | number; // 数值
  variant?: 'default' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  auxiliary?: string;     // 辅助信息(可选)
}
```

**视觉设计**:
- 标签: `text-xs text-muted-foreground` (12px)
- 数值: `text-4xl font-bold tracking-tight` (36px)
- 辅助信息: `text-sm text-muted-foreground` (14px)
- 图标: `h-4 w-4` (16px)
- 内边距: `p-4`
- 对齐: `text-center`
- 间距: `space-y-2`

**颜色变体**:
- `default`: `text-foreground`
- `success`: `text-green-500`
- `warning`: `text-orange-500`
- `error`: `text-red-500`

## 数据流和状态管理

### 数据获取

- 使用现有的 `useMonitoring()` hook
- 10 秒自动刷新,5 秒 stale time
- 数据来源: `/api/monitoring` 端点

### 加载状态

**骨架屏设计**:
- 使用 Tailwind 的 `animate-pulse` 类
- 骨架结构:
  - 外层: `animate-pulse bg-muted rounded`
  - 数值占位: `h-12 bg-muted-foreground/20 rounded`
  - 标签占位: `h-4 bg-muted-foreground/20 rounded w-20 mx-auto`

### 空状态

- 如果 `data` 为 `undefined` 且不在加载中,显示 "暂无数据"
- 使用统一的空状态样式

## 响应式设计

**移动端** (<768px):
- 单列垂直堆叠
- 每个指标占满宽度
- 保持内边距和间距

**平板端** (768px-1023px):
- 2x2 网格布局
- 每个指标占 50% 宽度

**桌面端** (≥1024px):
- 4 列横向布局
- 每个指标占 25% 宽度

## 实施清单

1. 创建 `OverviewWidget` 组件
2. 创建 `MetricItem` 子组件
3. 创建 `MetricItemSkeleton` 加载状态组件
4. 更新 `MonitoringPage` 使用新的 `OverviewWidget`
5. 移除旧的 4 个独立卡片代码
6. 测试响应式布局

## 设计决策

**选择方案一的原因**:
- 最符合"简洁数值风格"的需求
- 所有指标同等重要,无主次之分
- 实现简单,代码清晰
- 性能好,只渲染一个 Widget
- 响应式适配所有设备

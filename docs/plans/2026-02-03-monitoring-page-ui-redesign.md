# 监控页面 UI 重设计方案

**日期**: 2026-02-03
**设计师**: Claude + 用户
**状态**: 待实施

---

## 一、设计目标

### 主要目标
1. **风格统一**：与 ContentHomePage 保持完全一致的视觉风格
2. **快速巡检**：优化布局，一眼看清系统状态
3. **组件复用**：最大化使用现有 Widget 和 Column 组件

### 设计原则
- YAGNI：移除不必要的自定义样式
- 一致性优先：遵循 ContentHomePage 的设计语言
- 响应式优先：移动端和桌面端都有良好体验

---

## 二、布局架构

### 整体结构

```
┌─────────────────────────────────────────────────────────┐
│  页面头部                                                │
│  - 标题 + 描述                                           │
│  - 刷新按钮（右上角）                                     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  系统健康总览（4 个指标卡片，一行展示）                    │
│  [总内容] [今日新增] [队列任务] [系统状态]               │
└─────────────────────────────────────────────────────────┘
┌───────────┬──────────────────┬───────────┬───────────┐
│ 左侧栏    │ 中间主区域       │ 右侧栏 1  │ 右侧栏 2  │
│ small     │ medium           │ small     │ small     │
│           │                  │           │           │
│ 系统资源  │ 队列详情         │ 数据源    │ AI 性能  │
└───────────┴──────────────────┴───────────┴───────────┘
```

### 响应式断点

**桌面端（≥1024px）**：4 列布局
- Column 1: small (20%) - 系统资源
- Column 2: medium (40%) - 队列详情
- Column 3: small (20%) - 数据源健康
- Column 4: small (20%) - AI 性能

**移动端（<1024px）**：单列垂直堆叠

### 间距系统
- 所有层级间距：`gap-5`
- 页面边距：`p-4 md:p-6`
- Widget 内部边距：`p-4`（默认）

---

## 三、组件设计

### 3.1 指标卡片

**实现方式**：直接使用 Widget 组件

#### 总内容数卡片
```tsx
<Widget title="总内容数" icon={<Database className="h-4 w-4" />}>
  <div className="text-center py-2">
    <div className="text-4xl font-bold tracking-tight">
      {data?.overview.totalContents.toLocaleString()}
    </div>
  </div>
</Widget>
```

#### 今日新增卡片
```tsx
<Widget title="今日新增" icon={<TrendingUp className="h-4 w-4" />}>
  <div className="text-center py-2">
    <div className="text-4xl font-bold text-green-500">
      +{data?.overview.todayNew || 0}
    </div>
    <div className="text-sm text-muted-foreground mt-1">新内容</div>
  </div>
</Widget>
```

#### 队列任务卡片
```tsx
<Widget title="队列任务" icon={<Layers className="h-4 w-4" />}>
  <div className="space-y-3 py-2">
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">等待</span>
      <span className="text-xl font-bold text-blue-500">
        {data?.overview.queueWaiting || 0}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">处理中</span>
      <span className="text-xl font-bold text-orange-500">
        {data?.overview.queueActive || 0}
      </span>
    </div>
  </div>
</Widget>
```

#### 系统状态卡片
```tsx
<Widget title="系统状态" icon={<Activity className="h-4 w-4" />}>
  <div className="flex items-center justify-center py-2">
    <StatusIndicator
      status={data?.overview.systemStatus}
      variant="badge"
      size="lg"
    />
  </div>
</Widget>
```

**统一规范**：
- 最小高度：`min-h-[120px]`
- 数值字体：`text-4xl font-bold tracking-tight`
- 语义化颜色：绿色（正常）、红色（错误）、蓝色（等待）、橙色（处理中）

---

### 3.2 监控面板

#### SystemResourcesWidget（系统资源）

**布局**：垂直堆叠 3 个子区块

```tsx
<Widget
  title="系统资源"
  icon={<Server className="h-4 w-4" />}
  contentClassName="space-y-4"
>
  {/* 数据库状态 */}
  <div className="p-3 rounded-lg border bg-muted/30">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">数据库</span>
      <StatusIndicator
        status={data.database.status === 'connected' ? 'healthy' : 'error'}
        variant="badge"
      />
    </div>
    <div className="text-xs text-muted-foreground">
      连接数: {data.database.connectionCount}
    </div>
  </div>

  {/* Redis 状态 */}
  <div className="p-3 rounded-lg border bg-muted/30">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Redis</span>
      <StatusIndicator
        status={data.redis.status === 'connected' ? 'healthy' : 'error'}
        variant="badge"
      />
    </div>
    <Progress value={(data.redis.memoryUsage / data.redis.memoryLimit) * 100} />
    <div className="text-xs text-muted-foreground mt-1">
      内存: {MB} / {MB}
    </div>
  </div>

  {/* API 统计 */}
  <div className="p-3 rounded-lg border bg-muted/30">
    <div className="text-sm font-medium mb-2">API 统计</div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-xs text-muted-foreground">请求数</div>
        <div className="text-lg font-semibold">{data.api.requestCount}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">响应时间</div>
        <div className="text-lg font-semibold">{ms}ms</div>
      </div>
    </div>
  </div>
</Widget>
```

#### QueueDetailWidget（队列详情）

**布局**：充分利用 medium 列宽

```tsx
<Widget
  title="队列详情"
  icon={<Layers className="h-4 w-4" />}
  actions={<Badge variant="outline">{queue.name}</Badge>}
  contentClassName="space-y-4"
>
  {/* 队列状态网格 - 3x2 布局 */}
  <div className="grid grid-cols-3 gap-3">
    <div className="p-3 rounded-lg border bg-blue-500/5">
      <div className="text-xs text-muted-foreground mb-1">等待中</div>
      <div className="text-2xl font-bold text-blue-500">{queue.waiting}</div>
    </div>
    <div className="p-3 rounded-lg border bg-orange-500/5">
      <div className="text-xs text-muted-foreground mb-1">处理中</div>
      <div className="text-2xl font-bold text-orange-500">{queue.active}</div>
    </div>
    <div className="p-3 rounded-lg border bg-green-500/5">
      <div className="text-xs text-muted-foreground mb-1">已完成</div>
      <div className="text-2xl font-bold text-green-500">{queue.completed}</div>
    </div>
    <div className="p-3 rounded-lg border bg-red-500/5">
      <div className="text-xs text-muted-foreground mb-1">失败</div>
      <div className="text-2xl font-bold text-red-500">{queue.failed}</div>
    </div>
    <div className="p-3 rounded-lg border bg-purple-500/5">
      <div className="text-xs text-muted-foreground mb-1">延迟</div>
      <div className="text-2xl font-bold text-purple-500">{queue.delayed}</div>
    </div>
    <div className="p-3 rounded-lg border bg-muted/30">
      <div className="text-xs text-muted-foreground mb-1">总计</div>
      <div className="text-2xl font-bold">{total}</div>
    </div>
  </div>

  {/* 处理进度条 */}
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">处理进度</span>
      <span className="font-medium">{progressPercent}%</span>
    </div>
    <Progress value={progressPercent} className="h-3" />
  </div>

  {/* Worker 状态 */}
  {data.workers && (
    <div className="pt-3 border-t">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">活跃 Workers</span>
        <span className="font-semibold">
          {data.workers.active} / {data.workers.total}
        </span>
      </div>
    </div>
  )}
</Widget>
```

#### SourcesHealthWidget（数据源健康）

**布局**：紧凑列表，可滚动

```tsx
<Widget
  title="数据源健康"
  icon={<Database className="h-4 w-4" />}
  contentClassName="space-y-2"
>
  <div className="space-y-2 max-h-[400px] overflow-auto">
    {data.sources.map((source) => {
      const timeStatus = getTimeStatus(source.lastCollectedAt);

      return (
        <div key={source.id} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-2">
            <StatusIndicator
              status={source.enabled ? 'healthy' : 'error'}
              variant="dot"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm">{source.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {source.type}
              </div>
              <div className="text-xs mt-1 flex items-center gap-1">
                <span className="text-muted-foreground">最后:</span>
                <span className={timeStatus.color}>{timeStatus.text}</span>
              </div>
            </div>
            <Badge
              variant={source.enabled ? "default" : "secondary"}
              className="shrink-0 text-xs"
            >
              {source.enabled ? "启用" : "禁用"}
            </Badge>
          </div>
        </div>
      );
    })}
  </div>
</Widget>
```

#### AiPerformanceWidget（AI 性能）

**布局**：两个服务区块 + 底部性能指标

```tsx
<Widget
  title="AI 性能"
  icon={<Zap className="h-4 w-4" />}
  contentClassName="space-y-3"
>
  {/* 过滤服务 */}
  <div className="p-3 rounded-lg border bg-muted/30">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">过滤服务</span>
      <StatusIndicator
        status={getAiStatus(data.filterSuccessRate)}
        variant="badge"
        label={getAiLabel(data.filterSuccessRate)}
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-xs text-muted-foreground">调用次数</div>
        <div className="text-lg font-semibold">{data.filterCalls}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">成功率</div>
        <div className="text-lg font-semibold">
          {(data.filterSuccessRate * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  </div>

  {/* 实体提取服务 */}
  <div className="p-3 rounded-lg border bg-muted/30">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">实体提取</span>
      <StatusIndicator
        status={getAiStatus(data.extractSuccessRate)}
        variant="badge"
        label={getAiLabel(data.extractSuccessRate)}
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-xs text-muted-foreground">调用次数</div>
        <div className="text-lg font-semibold">{data.extractCalls}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">成功率</div>
        <div className="text-lg font-semibold">
          {(data.extractSuccessRate * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  </div>

  {/* 性能指标 - 底部汇总 */}
  <div className="pt-3 border-t grid grid-cols-2 gap-3">
    <div className="text-center p-2 rounded bg-muted/20">
      <div className="text-xs text-muted-foreground">平均响应</div>
      <div className="text-xl font-bold">{data.avgResponseTime.toFixed(0)}ms</div>
    </div>
    <div className="text-center p-2 rounded bg-muted/20">
      <div className="text-xs text-muted-foreground">通过率</div>
      <div className="text-xl font-bold">{(data.passRate * 100).toFixed(1)}%</div>
    </div>
  </div>
</Widget>
```

---

## 四、样式系统

### 4.1 状态指示系统

**StatusIndicator 组件增强**：
```typescript
interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'error';
  variant?: 'dot' | 'badge' | 'text';
  size?: 'sm' | 'md' | 'lg'; // 新增
  label?: string;
}
```

**辅助函数**：
```typescript
// AI 服务成功率映射
export function getAiStatus(successRate: number): StatusType {
  if (successRate >= 0.95) return 'healthy';
  if (successRate >= 0.85) return 'warning';
  return 'error';
}

export function getAiLabel(successRate: number): string {
  if (successRate >= 0.95) return '优秀';
  if (successRate >= 0.85) return '良好';
  return '需关注';
}

// 数据源时间状态映射
export function getTimeStatus(lastCollectedAt: Date | null): {
  text: string;
  status: StatusType;
  color: string;
} {
  if (!lastCollectedAt) {
    return { text: '未采集', status: 'error', color: 'text-red-500' };
  }

  const hoursDiff = (Date.now() - lastCollectedAt.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 1) {
    return { text: '刚刚', status: 'healthy', color: 'text-green-500' };
  }
  if (hoursDiff < 6) {
    return { text: `${Math.floor(hoursDiff)}h前`, status: 'warning', color: 'text-yellow-500' };
  }
  return {
    text: `${Math.floor(hoursDiff)}h前`,
    status: 'error',
    color: 'text-red-500'
  };
}
```

### 4.2 配色系统

**状态颜色**（复用现有）：
```typescript
export const statusStyles = {
  healthy: {
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    text: 'text-green-500',
    shadow: 'shadow-green-500/10',
  },
  warning: {
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    text: 'text-yellow-500',
    shadow: 'shadow-yellow-500/10',
  },
  error: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-500',
    shadow: 'shadow-red-500/10',
  },
} as const;
```

**语义化颜色**（用于队列等）：
```typescript
export const semanticColors = {
  blue: {
    bg: 'bg-blue-500/5',
    text: 'text-blue-500',
  },
  orange: {
    bg: 'bg-orange-500/5',
    text: 'text-orange-500',
  },
  purple: {
    bg: 'bg-purple-500/5',
    text: 'text-purple-500',
  },
  green: {
    bg: 'bg-green-500/5',
    text: 'text-green-500',
  },
  red: {
    bg: 'bg-red-500/5',
    text: 'text-red-500',
  },
} as const;
```

### 4.3 设计规范

**圆角系统**：
- Widget/卡片：`rounded-lg`（默认）
- Badge：`rounded-full`
- 不使用 `rounded-xl`

**内边距系统**：
- Widget content：`p-4`（默认）
- 紧凑卡片：`p-3`
- 指标卡片内部：`py-2`

**间距系统**：
- 页面级间距：`gap-5`
- Widget 内部间距：`space-y-3` 或 `space-y-4`

**字体系统**：
- 页面标题：`text-2xl font-bold`
- Widget 标题：`font-medium`
- 大号数值：`text-4xl font-bold tracking-tight`
- 中号数值：`text-2xl font-bold`
- 小号数值：`text-lg font-semibold`
- 辅助文字：`text-sm text-muted-foreground`
- 微小文字：`text-xs text-muted-foreground`

---

## 五、数据流和错误处理

### 5.1 数据流架构

**Hook 层**：`apps/web/src/hooks/useMonitoring.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';

export function useMonitoring() {
  return useQuery({
    queryKey: monitoringApi.queryKeys.metrics(),
    queryFn: monitoringApi.getMetrics,
    refetchInterval: 10000, // 10 秒自动刷新
    staleTime: 5000,
  });
}
```

**API 层**：`apps/web/src/lib/api/monitoring.ts`
```typescript
import type { MonitoringMetricsResponseData } from '@intellipick/shared';

export const monitoringApi = {
  queryKeys: {
    all: ['monitoring'] as const,
    metrics: () => ['monitoring', 'metrics'] as const,
  },

  getMetrics: async (): Promise<MonitoringMetricsResponseData> => {
    const res = await fetch('/api/v1/monitoring');
    if (!res.ok) throw new Error('Failed to fetch monitoring data');
    return res.json();
  },
};
```

**组件层**：数据传递
```typescript
// MonitoringPage
const { data, isLoading, error, refetch } = useMonitoring();

// 指标卡片 - 直接取值
<Widget title="总内容数">
  {data?.overview.totalContents.toLocaleString()}
</Widget>

// 监控面板 - 传递完整数据块
<QueueDetailWidget data={data?.queue} />
<AiPerformanceWidget data={data?.aiPerformance} />
```

### 5.2 错误处理

**页面级错误**：
```tsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">加载监控数据失败</h3>
      <p className="text-sm text-muted-foreground mb-4">
        请检查网络连接或稍后重试
      </p>
      <Button onClick={() => refetch()} variant="outline">
        重新加载
      </Button>
    </div>
  );
}
```

**组件级空状态**：
```tsx
export function QueueDetailWidget({ data }: QueueWidgetProps) {
  if (!data || !data.queues || data.queues.length === 0) {
    return (
      <Widget title="队列详情">
        <WidgetEmptyState message="暂无队列数据" iconType="queue" />
      </Widget>
    );
  }
  // 正常渲染
}
```

### 5.3 自动刷新

- **自动刷新间隔**：10 秒
- **手动刷新**：右上角刷新按钮
- **暂停刷新**：用户离开页面时自动暂停（TanStack Query 默认）

---

## 六、实施计划

### 阶段 1：重构现有组件（1-2 小时）

**任务**：
1. 删除 `MetricCard.tsx`
2. 删除 `styles.ts` 中的自定义样式（保留 StatusIndicator 需要的部分）
3. 增强 `StatusIndicator.tsx` 添加 size 属性
4. 创建 4 个新的 Widget 组件：
   - `SystemResourcesWidget.tsx`
   - `QueueDetailWidget.tsx`
   - `SourcesHealthWidget.tsx`
   - `AiPerformanceWidget.tsx`

**文件操作**：
- 删除：`apps/web/src/components/monitoring/MetricCard.tsx`
- 修改：`apps/web/src/components/monitoring/StatusIndicator.tsx`
- 修改：`apps/web/src/components/monitoring/styles.ts`
- 新建：4 个 Widget 组件文件

### 阶段 2：重构主页面（30 分钟）

**任务**：
1. 更新 `MonitoringPage.tsx`
2. 使用 Column 组件替代 grid 布局
3. 替换所有 Card 为 Widget
4. 统一间距为 gap-5
5. 更新导入路径

**代码变更**：
```typescript
// 之前
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <QueueStatus data={data?.queue} />
  <AiPerformance data={data?.aiPerformance} />
</div>

// 之后
<div className="flex flex-col lg:flex-row gap-5">
  <Column size="small">
    <SystemResourcesWidget data={data?.systemResources} />
  </Column>
  <Column size="medium">
    <QueueDetailWidget data={data?.queue} />
  </Column>
  <Column size="small">
    <SourcesHealthWidget data={data?.sources} />
  </Column>
  <Column size="small">
    <AiPerformanceWidget data={data?.aiPerformance} />
  </Column>
</div>
```

### 阶段 3：样式调整（30 分钟）

**任务**：
1. 确保所有圆角为 `rounded-lg`
2. 确保所有内边距为 `p-3` 或 `p-4`
3. 统一状态颜色
4. 移除自定义 `cardStyles`
5. 统一字体大小

### 阶段 4：测试和验证（30 分钟）

**功能测试**：
- [ ] 数据加载正常
- [ ] 刷新功能正常
- [ ] 错误处理正常
- [ ] 空状态显示正常

**视觉验证**：
- [ ] 与 ContentHomePage 风格一致
- [ ] 响应式布局正常
- [ ] 所有状态指示正确
- [ ] 移动端显示正常

**兼容性测试**：
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] 移动端浏览器

---

## 七、文件清单

### 需要修改的文件

1. `apps/web/src/pages/MonitoringPage.tsx` - 主页面重构
2. `apps/web/src/components/monitoring/StatusIndicator.tsx` - 增强 size 属性
3. `apps/web/src/components/monitoring/styles.ts` - 清理自定义样式
4. `apps/web/src/components/monitoring/index.ts` - 更新导出

### 需要删除的文件

1. `apps/web/src/components/monitoring/MetricCard.tsx` - 被 Widget 替代
2. `apps/web/src/components/monitoring/QueueStatus.tsx` - 重命名为 QueueDetailWidget
3. `apps/web/src/components/monitoring/AiPerformance.tsx` - 重命名为 AiPerformanceWidget
4. `apps/web/src/components/monitoring/SourcesHealth.tsx` - 重命名为 SourcesHealthWidget
5. `apps/web/src/components/monitoring/SystemResources.tsx` - 重命名为 SystemResourcesWidget

### 需要新建的文件

1. `apps/web/src/components/monitoring/QueueDetailWidget.tsx`
2. `apps/web/src/components/monitoring/AiPerformanceWidget.tsx`
3. `apps/web/src/components/monitoring/SourcesHealthWidget.tsx`
4. `apps/web/src/components/monitoring/SystemResourcesWidget.tsx`

---

## 八、设计验收标准

### 必须满足（Must Have）

- [x] 使用 Widget 组件替代所有 Card
- [x] 使用 Column 组件实现 4 列布局
- [x] 统一间距为 gap-5
- [x] 统一圆角为 rounded-lg
- [x] 与 ContentHomePage 风格完全一致

### 应该满足（Should Have）

- [x] 响应式布局正常（移动端单列）
- [x] 加载状态使用 WidgetLoadingState
- [x] 空状态使用 WidgetEmptyState
- [x] 错误处理使用 WidgetErrorState

### 可以满足（Nice to Have）

- [x] 自动刷新功能
- [x] 手动刷新按钮
- [x] 状态指示带颜色变化
- [x] 队列详情的 3x2 网格布局

---

## 九、风险评估

### 低风险
- 组件复用：Widget 和 Column 是成熟组件
- 类型安全：所有类型定义已存在

### 中风险
- 布局调整：4 列布局在不同屏幕尺寸下的表现
- 性能影响：10 秒自动刷新可能带来性能问题

### 缓解措施
- 充分测试响应式布局
- 考虑添加刷新暂停开关
- 监控 API 响应时间

---

## 十、后续优化建议

1. **性能优化**
   - 考虑使用 WebSocket 替代轮询
   - 实现增量更新而非全量刷新

2. **功能增强**
   - 添加历史趋势图表
   - 支持自定义监控面板布局
   - 添加告警阈值配置

3. **用户体验**
   - 添加快捷键支持（R 刷新）
   - 支持导出监控报告
   - 添加全屏模式

---

**文档版本**: 1.0
**最后更新**: 2026-02-03

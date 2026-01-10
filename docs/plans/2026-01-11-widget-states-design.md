# Widget 状态管理系统设计

**日期**: 2026-01-11
**作者**: Claude Code
**状态**: 设计完成，待实现

## 概述

为所有 Widget 组件添加统一的状态管理系统（loading、empty、error），减少重复代码，提供一致的用户体验。

## 问题陈述

当前每个 Widget 都需要手动处理状态：
- 代码重复：每个 Widget 都写 loading/empty/error 判断
- 不一致：状态展示方式各异
- 缺失：很多 Widget 没有错误处理
- 维护困难：修改状态 UI 需要改动多个文件

## 解决方案

创建 `WidgetWithStates` 智能封装组件，自动处理所有状态，让 Widget 专注于渲染成功状态。

## 核心组件

### 1. WidgetWithStates（智能封装）

**职责**：
- 接收 TanStack Query 对象
- 自动判断并渲染对应状态
- 提供灵活的自定义选项

**接口设计**：

```typescript
interface WidgetWithStatesProps<TData> {
  // Widget 基础属性
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;

  // 数据查询
  query: UseQueryResult<TData>;

  // 状态配置（可选）
  loading?: boolean | ReactNode;
  empty?: boolean | { message?: string; icon?: ReactNode };
  error?: boolean | { message?: string; showDetails?: boolean };

  // 成功状态渲染
  children: (data: TData) => ReactNode;
}
```

**状态处理逻辑**：

1. **Loading**：`query.isLoading` → 渲染骨架屏
2. **Error**：`query.error` → 渲染错误状态 + 重试按钮
3. **Empty**：数据为空数组/null → 渲染空状态
4. **Success**：渲染 `children(data)`

### 2. WidgetLoadingState（骨架屏）

**变体**：
- `list`：列表项骨架（默认）
- `tag`：标签云骨架
- `card`：卡片网格骨架

**实现**：

```typescript
export function WidgetLoadingState({
  lines = 3,
  variant = "list"
}: { lines?: number; variant?: "list" | "card" | "tag" }) {
  // 使用 animate-pulse 实现脉冲动画
}
```

### 3. WidgetEmptyState（空状态）

**特点**：
- 图标 + 文字（简洁版）
- 预设常用图标（Inbox、Hash、Users、FileText）
- 支持自定义图标和文案

**实现**：

```typescript
export function WidgetEmptyState({
  message = "暂无数据",
  icon
}: { message?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-muted-foreground/50 mb-3">{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```

### 4. WidgetErrorState（错误状态）

**功能**：
- ❌ 错误图标
- 📝 错误信息（可自定义）
- 🔄 重试按钮（调用 `query.refetch()`）
- 📋 错误详情（可展开，显示 message + stack）

**实现**：

```typescript
export function WidgetErrorState({
  error,
  onRetry,
  config
}: { error: Error; onRetry: () => void; config?: ErrorConfig }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <AlertCircleIcon className="h-8 w-8 text-destructive/50" />
      <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCwIcon className="h-3 w-3" /> 重试
      </Button>
      {showErrorDetails && (
        <details>
          <summary onClick={() => setShowDetails(!showDetails)}>
            查看/隐藏错误详情
          </summary>
          {showDetails && <pre>{error.message}{error.stack}</pre>}
        </details>
      )}
    </div>
  );
}
```

## 使用示例

### 迁移前（PopularTagsWidget）

```typescript
// ~80 行代码，手动处理状态
if (isLoading) {
  return <Widget><Skeleton /></Widget>;
}
if (tagList.length === 0) {
  return <Widget>暂无数据</Widget>;
}
// ❌ 缺少 error 处理
return <Widget>{/* 渲染标签 */}</Widget>;
```

### 迁移后

```typescript
// ~40 行代码，自动处理所有状态
<WidgetWithStates
  query={tagsQuery}
  title="热门标签"
  icon={<Hash className="h-4 w-4" />}
  loading={<WidgetLoadingState variant="tag" />}
  empty={{ message: "暂无热门标签" }}
>
  {(tags) => (
    <>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => <Badge key={tag.name}>{tag.name}</Badge>)}
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-center text-muted-foreground">
        共 {tags.length} 个标签
      </div>
    </>
  )}
</WidgetWithStates>
```

**收益**：
- ✅ 代码减少 50%
- ✅ 自动获得错误处理
- ✅ 统一的状态展示
- ✅ 更易维护

## 文件组织

```
apps/web/src/components/widgets/
├── Widget.tsx                    # 基础 Widget（保持不变）
├── WidgetWithStates.tsx          # 新增
├── WidgetLoadingState.tsx        # 新增
├── WidgetEmptyState.tsx          # 新增
├── WidgetErrorState.tsx          # 新增
├── WidgetSkeleton.tsx            # 保留（向后兼容）
├── index.ts                      # 导出所有组件
└── [具体 Widget 组件]
```

## 迁移策略

### 阶段 1：创建基础设施（无破坏性更改）
- [ ] 创建 4 个新组件文件
- [ ] 更新 `index.ts` 导出
- [ ] 编写单元测试

### 阶段 2：逐个迁移 Widget

**优先级**：
1. **高优先级** - PopularTagsWidget（已有数据逻辑）
2. **高优先级** - TrendingEntitiesWidget（需要错误处理）
3. **中优先级** - LatestContentsWidget
4. **低优先级** - 纯 UI Widget 保持不变

**迁移检查清单**：
- [ ] 使用 `useQuery`？
- [ ] 有 `isLoading` 处理？
- [ ] 有 empty 判断？
- [ ] 有 error 处理？
- [ ] 保留原有 className props
- [ ] 测试所有状态

### 阶段 3：优化和清理
- [ ] 统一错误信息文案
- [ ] 添加更多骨架屏变体
- [ ] 给 `WidgetSkeleton` 添加 `@deprecated`

## 测试策略

### 单元测试

```typescript
describe("WidgetWithStates", () => {
  it("应该显示 loading 状态");
  it("应该显示 empty 状态（数组）");
  it("应该显示 empty 状态（null）");
  it("应该显示 error 状态并支持重试");
  it("应该渲染成功状态");
  it("应该允许自定义 loading 组件");
  it("应该允许禁用某个状态（loading=false）");
});
```

### 集成测试
- 真实 API 环境测试状态切换
- 模拟网络错误、超时
- 验证重试功能

### 视觉回归测试
- 确保迁移后样式无破坏
- 截图对比 loading/empty/error 状态

## 向后兼容性

- ✅ 现有 `Widget` 组件保持不变
- ✅ 现有 `WidgetSkeleton` 继续可用
- ✅ 纯 UI Widget（如 DateRangeWidget）无需修改
- ✅ 可选择性迁移，不强制一次性改完

## 技术栈

- React 18
- TypeScript 5.7
- TanStack Query v5
- Tailwind CSS 4
- Lucide React（图标）

## 预计工作量

| 任务 | 时间 |
|------|------|
| 创建基础组件 | 2-3 小时 |
| 迁移 3 个主要 Widget | 1-2 小时 |
| 测试和优化 | 1 小时 |
| **总计** | **4-6 小时** |

## 风险和缓解

| 风险 | 缓解措施 |
|------|----------|
| 破坏现有样式 | 保持相同的 DOM 结构和 className |
| 性能影响 | 使用 React.memo 优化状态组件 |
| 迁移工作量大 | 渐进式迁移，不强制一次性完成 |

## 未来改进

- [ ] 支持更多骨架屏变体（table、chart）
- [ ] 添加全局 Widget 状态配置
- [ ] 支持自动重试（exponential backoff）
- [ ] 添加性能监控（Track state transition timing）

## 参考资料

- TanStack Query 文档：https://tanstack.com/query/latest
- 现有 Widget 实现：`apps/web/src/components/widgets/`
- 项目文档：`docs/`

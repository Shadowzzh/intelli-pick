# 固定高度布局设计方案

**日期**: 2026-01-10
**目标**: 让 ContentListNew 组件刚好撑满视口高度，使用 CSS 原生高度计算

## 架构概述

### 布局层级

1. **最外层**: `ContentHomePage` 容器保持 `min-h-screen`
2. **中间层**: 3列布局容器使用 `flex flex-col lg:flex-row`
3. **目标列**: 中间列（medium Column）设置固定高度 `h-[calc(100vh-...)]`
4. **Widget 层**: `ContentListNew` 的 Widget 组件使用 `h-full flex flex-col`

### 高度计算公式

```
ContentListNew 高度 = 100vh - PageHeader 高度 - 页面上下 padding
```

当前估计值：
- `100vh`: 视口总高度
- `8rem` (约 64px): PageHeader 高度
- `4rem` (约 64px): 页面上下 padding (p-4 + md:p-6)

## 组件实现

### 1. Widget 组件修改

**文件**: `apps/web/src/components/widgets/Widget.tsx`

```tsx
export function Widget({
  title,
  icon,
  actions,
  className,
  headerClassName,
  contentClassName,
  children,
}: WidgetProps) {
  return (
    <div
      className={cn(
        "widget rounded-lg border bg-card text-card-foreground overflow-hidden",
        "flex flex-col", // 支持垂直 flex 布局
        className,
      )}
    >
      {/* Widget Header */}
      <div
        className={cn(
          "widget-header flex items-center justify-between gap-2 px-4 py-3 border-b",
          "flex-shrink-0", // 防止 header 被压缩
          headerClassName,
        )}
      >
        ...
      </div>

      {/* Widget Content */}
      <div className={cn(
        "widget-content p-4 overflow-auto",
        "flex-1", // 自动填充剩余空间
        contentClassName
      )}>
        {children}
      </div>
    </div>
  );
}
```

### 2. ContentHomePage 修改

**文件**: `apps/web/src/pages/ContentHomePage.tsx`

```tsx
<Column
  size="medium"
  className="lg:h-[calc(100vh-8rem-4rem)] h-auto"
>
  <ContentListNew />
</Column>
```

关键改动：
- 添加 `lg:h-[calc(100vh-8rem-4rem)]` 在大屏幕上启用固定高度
- 添加 `h-auto` 在小屏幕上使用自然流
- 移除 `ContentListNew` 上的 `contentClassName="max-h-[80vh] overflow-auto"`

### 3. PageHeader 高度处理（可选）

**文件**: `apps/web/src/components/layout/PageHeader.tsx`

如果 PageHeader 高度动态变化，添加固定高度约束：

```tsx
<div className="flex items-center justify-between gap-4 min-h-16">
  ...
</div>
```

## 响应式和边界情况

### 响应式断点

- **大屏幕（lg，≥1024px）**: 4列横向布局，ContentListNew 使用固定高度
- **小屏幕（<1024px）**: 纵向堆叠布局，禁用固定高度，使用自然流

### 内容状态处理

- **内容为空**: `overflow-auto` 正常生效，无滚动条
- **内容溢出**: Widget content 区域内自动出现滚动条
- **加载状态**: Loader 在 content 区域内正常显示

### 边缘情况

- FilterDisplay 组件占用高度自动计算在 content 区域内
- 分页信息随内容滚动（如需固定可见需额外处理）

## 实施步骤

1. **修改 Widget 组件** (`apps/web/src/components/widgets/Widget.tsx`)
   - 添加 `flex flex-col` 到根 div
   - 添加 `flex-shrink-0` 到 header
   - 添加 `flex-1` 到 content div

2. **修改 ContentHomePage** (`apps/web/src/pages/ContentHomePage.tsx`)
   - 给中间 Column 添加 `lg:h-[calc(100vh-8rem-4rem)] h-auto`
   - 移除 ContentListNew 上的硬编码高度

3. **验证 PageHeader 高度** (`apps/web/src/components/layout/PageHeader.tsx`)
   - 检查实际高度
   - 必要时添加 `min-h-16` 或 `h-16`

4. **调整计算值**
   - 使用浏览器 DevTools 精确测量
   - 微调 `calc()` 中的值

5. **测试边界情况**
   - 大小屏幕测试
   - 不同内容状态测试
   - 窗口 resize 测试

## 测试验证

### 视觉验证
- ContentListNew 底部刚好到达视口底部
- 左右两侧列保持自然高度
- 窗口 resize 时高度自动调整

### 功能验证
- FilterDisplay 正常工作
- 内容列表可以正常滚动
- 视图模式切换不影响高度

### 响应式验证
- 不同断点测试（sm、md、lg、xl）
- 小屏幕上使用自然流布局

### 浏览器兼容性
- Chrome、Firefox、Safari、Edge
- `calc()` 和 `flex-1` 在现代浏览器中都支持

## 优化建议

1. **精确计算 PageHeader 高度**
   - 使用 CSS 变量动态传递高度
   - 避免硬编码估计值

2. **添加过渡动画**
   ```tsx
   className="transition-all duration-200 ease-out"
   ```

3. **性能优化**
   - 避免复杂的 CSS 选择器
   - 使用 `will-change: overflow` 提示浏览器

4. **用户自定义高度（可选）**
   - 将计算值提取为组件 props
   - 允许用户调节高度

## 技术栈

- CSS Grid/Flexbox
- Tailwind CSS 4
- `calc()` 函数
- `vh` 视口单位
- React 组件 props 传递

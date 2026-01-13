# Web 应用结构理解指南

> 本文档指导如何快速理解 web 应用的架构，而非静态快照

## 如何理解技术栈

**首先读取**: `apps/web/package.json`
- `dependencies` - 运行时依赖（关注：React、路由、状态管理、数据获取、UI 库）
- `devDependencies` - 构建工具（关注：Vite、TypeScript、Tailwind）
- `scripts` - 可用命令

**关键依赖识别**:
- React 相关: `react`, `react-dom`, `react-router-dom`
- 状态管理: `zustand`
- 数据获取: `@tanstack/react-query`, `axios`
- 实时通信: `socket.io-client`
- UI 组件: `@radix-ui/*`, `lucide-react`
- 样式: `tailwindcss`, `@tailwindcss/*`, `next-themes`

## 如何理解目录结构

**使用**: `tree -L 2 apps/web/src` 或 `ls -la` 遍历

**标准结构模式**:
```
src/
├── components/    # UI 组件（按功能或领域分组）
├── hooks/         # 自定义 React Hooks
├── lib/           # 工具函数、API 客户端、配置
├── pages/         # 路由页面组件
├── store/         # 全局状态（Zustand stores）
├── styles/        # 全局样式
├── App.tsx        # 路由配置
└── main.tsx       # 应用入口
```

**探索策略**:
1. 查看 `src/main.tsx` - 了解 Provider 层次和初始化
2. 查看 `src/App.tsx` - 了解路由结构
3. 浏览 `src/pages/` - 识别主要页面
4. 检查 `src/store/` - 理解状态管理
5. 查看 `src/lib/api/` - 了解 API 集成

## 如何理解路由结构

**读取**: `src/App.tsx`
- 查找 `<Routes>` 和 `<Route>` 定义
- 识别路径和对应的页面组件
- 注意嵌套路由和布局组件

**关键问题**:
- 有哪些主要页面？
- 是否有受保护的路由？
- 布局组件如何复用？

## 如何理解状态管理

**检查**: `src/store/` 目录
- 列出所有 `*-store.ts` 文件
- 每个 store 管理哪个领域？
- 是否使用持久化（localStorage/sessionStorage）？

**Zustand 模式识别**:
```typescript
// 查找这些模式
export const useXxxStore = create<State>()(
  persist(...) // 持久化？
)

interface State {
  // 数据
  // Actions
}
```

**关键问题**:
- 全局状态有哪些？
- 哪些状态需要持久化？
- 状态如何影响 UI？

## 如何理解 API 集成

**步骤**:
1. 检查 `src/lib/api.ts` - Axios 实例配置
2. 浏览 `src/lib/api/` - API 模块（按资源分组）
3. 查看 `src/lib/react-query.ts` - TanStack Query 配置
4. 检查 `src/lib/socket.ts` - WebSocket 连接

**API 模块模式**:
```typescript
// 每个模块导出函数
export async function getXxx(params) {
  return api.get('/xxx', { params })
}
```

**关键问题**:
- API 基础 URL 在哪里配置？
- 有哪些资源端点？
- 是否有实时更新？

## 如何理解组件架构

**浏览**: `src/components/` 目录结构
- 按功能分组（content, entity, stats, widgets）还是类型（ui, layout）？
- 是否有设计系统或组件库？

**识别常见模式**:

### HOC / Wrapper 模式
```typescript
// 查找类似这样的包装器
export function WidgetWithStates({ children, ... }) {
  // 处理 loading/error/empty
}
```

### Compound Components
```typescript
// 查找相关组件组
<Widget>
  <Widget.Header />
  <Widget.Content />
</Widget>
```

### 布局组件
- 查找 `layout/` 目录
- 识别网格、列、容器组件

**关键问题**:
- 有哪些可复用的模式？
- 组件如何共享状态？
- 是否有组件库集成（Radix UI、Headless UI）？

## 如何理解 Provider 结构

**读取**: `src/main.tsx`
- Provider 嵌套顺序
- 每个 Provider 的作用

**常见 Provider**:
- `ThemeProvider` - 主题切换
- `QueryProvider` - 数据获取
- `Router` - 路由
- `ErrorBoundary` - 错误处理
- 自定义 Context Providers

## 架构不变原则

以下原则通常保持稳定：

1. **关注点分离**
   - UI 组件在 `components/`
   - 业务逻辑在 `hooks/` 和 `store/`
   - API 调用在 `lib/api/`

2. **类型安全**
   - 从 workspace packages 导入共享类型
   - 避免 `any`，使用严格的 TypeScript

3. **响应式优先**
   - 移动端和桌面端适配
   - Tailwind CSS 实用类

4. **性能考虑**
   - 代码分割（React.lazy）
   - 查询缓存（TanStack Query）
   - 虚拟化长列表

5. **可维护性**
   - 小而专注的组件
   - 清晰的命名约定
   - 一致的文件结构

## 快速启动清单

开始修改前，按此顺序快速建立心智模型：

1. ✅ 读取 `package.json` - 了解技术栈
2. ✅ 查看 `src/main.tsx` - 了解应用初始化
3. ✅ 查看 `src/App.tsx` - 了解路由结构
4. ✅ 浏览 `src/` 目录 - 了解代码组织
5. ✅ 检查 `src/store/` - 了解全局状态
6. ✅ 查看相关页面组件 - 了解具体功能

## 修改策略

### 添加新功能
1. 确定涉及的层次（UI / 状态 / API）
2. 从外到内或从内到外？
   - UI 驱动：页面 → 组件 → API → 状态
   - 数据驱动：API → 状态 → 组件 → 页面
3. 识别可复用的模式和组件
4. 保持现有架构风格一致

### 修改现有功能
1. 使用 Grep 查找相关代码
2. 追踪数据流：状态 → Props → UI
3. 检查副作用：useEffect、事件处理
4. 考虑影响范围：局部 vs 全局

### 调试问题
1. 检查 React DevTools - 组件树和 props
2. 检查 TanStack Query DevTools - 查询状态
3. 检查 Network 面板 - API 请求
4. 检查 Console - 错误和警告
5. 检查 Zustand DevTools - 状态变化

## 关键文件快速参考

| 目的 | 查看文件 |
|------|---------|
| 应用入口 | `src/main.tsx` |
| 路由配置 | `src/App.tsx` |
| 全局状态 | `src/store/*.ts` |
| API 集成 | `src/lib/api/*.ts` |
| 类型定义 | `@intellipick/shared`, `@intellipick/db` |
| 样式配置 | `src/styles/globals.css`, `tailwind.config.js` |
| 构建配置 | `vite.config.ts`, `tsconfig.json` |

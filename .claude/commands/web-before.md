# Web 应用结构理解指南

<context>
快速理解 Web 前端应用的架构和实现。
本文档聚焦于前端代码的组织、状态管理、UI 组件等。
</context>

<quick_reference>
  <module>web</module>
  <location>apps/web</location>
  <stack>React 18 + Vite 6 + TypeScript 5.7 + Zustand 4 + TanStack Query 5</stack>
  <key_dirs>components, pages, store, lib, hooks</key_dirs>
  <main_files>src/main.tsx, src/App.tsx</main_files>
</quick_reference>

<when_to_reference_other_docs>
仅在以下情况才需要查看其他文档:
- 需要理解 API 接口定义或修改后端时 → 查看 `api-before.md`
- 需要理解共享类型、数据库 schema 或添加新的共享功能时 → 查看 `packages-before.md`
- 只修改前端 UI、组件、状态管理时 → 无需查看其他文档
</when_to_reference_other_docs>

## 如何理解技术栈

<instructions>
1. 首先读取 `apps/web/package.json`
2. 从 `dependencies` 识别运行时依赖
3. 从 `devDependencies` 识别构建工具
4. 检查 `scripts` 了解可用命令
</instructions>

<dependency_patterns>
关键依赖类别：
- React 生态: `react`, `react-dom`, `react-router-dom`
- 状态管理: `zustand`, `redux`, `jotai`, `valtio`
- 数据获取: `@tanstack/react-query`, `axios`, `swr`
- 实时通信: `socket.io-client`, `ws`
- UI 组件库: `@radix-ui/*`, `@headlessui/*`, `@mui/*`
- 样式方案: `tailwindcss`, `styled-components`, `emotion`
- 主题系统: `next-themes`
</dependency_patterns>

## 如何理解目录结构

<instructions>
使用命令: `tree -L 2 apps/web/src` 或递归 `ls -la` 遍历目录
</instructions>

<standard_structure>
React 应用的典型目录模式:
```
src/
├── components/    # UI 组件（按功能或领域分组）
├── hooks/         # 自定义 React Hooks
├── lib/           # 工具函数、API 客户端、配置
├── pages/         # 路由页面组件
├── store/         # 全局状态管理
├── styles/        # 全局样式
├── App.tsx        # 路由配置
└── main.tsx       # 应用入口
```
</standard_structure>

<exploration_strategy>
按此顺序探索以建立心智模型:
1. `src/main.tsx` - Provider 层次和应用初始化
2. `src/App.tsx` - 路由结构和页面组织
3. `src/pages/` - 识别主要功能页面
4. `src/store/` - 全局状态管理方案
5. `src/lib/api/` - API 集成模式
6. `src/components/` - 组件组织和可复用模式
</exploration_strategy>

## 如何理解路由结构

<instructions>
1. 读取 `src/App.tsx` 文件
2. 查找 `<Routes>` 和 `<Route>` JSX 元素
3. 识别每个路径对应的页面组件
4. 注意嵌套路由和布局包装
</instructions>

<key_questions>
分析时回答这些问题:
- 有哪些主要页面路径？
- 是否存在受保护的路由（需要认证）？
- 布局组件如何被复用？
- 是否有动态路由参数？
- 404 或错误页面如何处理？
</key_questions>

## 如何理解状态管理

<instructions>
1. 检查 `src/store/` 目录
2. 列出所有 `*-store.ts` 或 `*-slice.ts` 文件
3. 识别每个 store 管理的领域
4. 检查是否使用持久化中间件
</instructions>

<pattern_recognition>
<zustand_pattern>
```typescript
// Zustand 典型模式
export const useXxxStore = create<State>()(
  persist(
    (set, get) => ({
      // 状态
      data: null,
      // Actions
      setData: (data) => set({ data }),
    }),
    { name: 'xxx-storage' } // 持久化配置
  )
)
```
</zustand_pattern>

<redux_pattern>
```typescript
// Redux Toolkit 典型模式
const xxxSlice = createSlice({
  name: 'xxx',
  initialState,
  reducers: { ... }
})
```
</redux_pattern>
</pattern_recognition>

<key_questions>
- 应用有哪些全局状态？
- 哪些状态持久化到 localStorage/sessionStorage？
- 状态更新如何触发 UI 重渲染？
- 是否有状态派生逻辑（selectors）？
</key_questions>

## 如何理解 API 集成

<instructions>
按此顺序检查 API 集成:
1. `src/lib/api.ts` - HTTP 客户端实例配置（Axios/Fetch）
2. `src/lib/api/` - 按资源分组的 API 模块
3. `src/lib/react-query.ts` - TanStack Query 配置（如果使用）
4. `src/lib/socket.ts` - WebSocket/实时连接（如果使用）
5. 环境变量文件 - API URL 配置
</instructions>

<api_module_pattern>
```typescript
// 典型的 API 模块结构
import { api } from '../api';

export async function getItems(params?: GetItemsParams) {
  const response = await api.get('/items', { params });
  return response.data;
}

export async function createItem(data: CreateItemData) {
  const response = await api.post('/items', data);
  return response.data;
}
```
</api_module_pattern>

<key_questions>
- API 基础 URL 配置在哪里？（环境变量还是硬编码？）
- 有哪些资源端点模块？
- 是否有请求/响应拦截器？
- 错误处理策略是什么？
- 是否使用实时更新（WebSocket、SSE）？
- 认证 token 如何管理？
</key_questions>

## 如何理解组件架构

<instructions>
1. 浏览 `src/components/` 目录结构
2. 识别组织方式：按功能分组还是按类型？
3. 查找可复用的组件模式
4. 检查是否集成了第三方组件库
</instructions>

<component_patterns>
<hoc_pattern>
```typescript
// 高阶组件 (HOC) 模式
export function withAuth<P>(Component: React.ComponentType<P>) {
  return (props: P) => {
    const { user } = useAuth();
    if (!user) return <Login />;
    return <Component {...props} />;
  };
}
```
</hoc_pattern>

<compound_pattern>
```typescript
// 复合组件模式
<Card>
  <Card.Header />
  <Card.Content />
  <Card.Footer />
</Card>
```
</compound_pattern>

<render_props_pattern>
```typescript
// Render Props 模式
<DataProvider>
  {({ data, loading }) => (
    loading ? <Spinner /> : <Display data={data} />
  )}
</DataProvider>
```
</render_props_pattern>
</component_patterns>

<key_questions>
- 组件如何组织？（功能域 vs 类型）
- 是否有统一的设计系统？
- 使用哪些第三方组件库？（Radix UI、Headless UI、MUI）
- 有哪些可复用的组件模式？
- 组件间如何共享状态？（Props、Context、Store）
- 是否有布局组件系统？
</key_questions>

## 如何理解 Provider 结构

<instructions>
1. 读取 `src/main.tsx` 或入口文件
2. 识别 Provider 的嵌套顺序
3. 理解每个 Provider 的职责
</instructions>

<common_providers>
- `ThemeProvider` - 主题系统（亮/暗模式）
- `QueryClientProvider` - TanStack Query 数据获取
- `Router` / `BrowserRouter` - React Router 路由
- `ErrorBoundary` - 错误捕获和回退 UI
- `AuthProvider` - 认证和用户上下文
- 自定义业务 Context Providers
</common_providers>

<key_questions>
- Provider 的顺序是否重要？（依赖关系）
- 是否有全局的 ErrorBoundary？
- Context 值如何在组件树中传递？
</key_questions>

## 架构不变原则

<architectural_principles>
<principle name="关注点分离">
- UI 组件: `components/`
- 业务逻辑: `hooks/` 和 `store/`
- API 调用: `lib/api/`
- 类型定义: 从 workspace packages 导入
</principle>

<principle name="类型安全">
- 使用严格的 TypeScript 配置
- 避免 `any`，使用具体类型
- 利用类型推断
- 从 monorepo packages 复用类型
</principle>

<principle name="响应式优先">
- 移动端优先设计
- 使用响应式工具类（Tailwind）
- 测试多种屏幕尺寸
</principle>

<principle name="性能优化">
- 代码分割: `React.lazy()` + `Suspense`
- 查询缓存: TanStack Query
- 虚拟化: 长列表渲染优化
- 图片懒加载
</principle>

<principle name="可维护性">
- 组件保持小而专注（单一职责）
- 使用描述性的命名
- 保持一致的代码风格
- 编写自文档化的代码
</principle>
</architectural_principles>

## 快速启动清单

<checklist>
开始任何修改前，按此顺序建立心智模型：

1. ✅ 读取 `apps/web/package.json` - 识别技术栈
2. ✅ 读取 `src/main.tsx` - 理解应用初始化和 Provider
3. ✅ 读取 `src/App.tsx` - 理解路由结构
4. ✅ 浏览 `src/` 目录树 - 理解代码组织
5. ✅ 检查 `src/store/` - 理解全局状态管理
6. ✅ 查看目标页面/组件 - 理解具体实现

<note>
只需快速浏览，不要深入细节。目标是建立 30,000 英尺的视角。
</note>
</checklist>

## 修改策略

<strategy name="添加新功能">
<instructions>
1. 确定涉及的架构层次: UI / 业务逻辑 / 状态 / API
2. 选择开发方向:
   - **UI 驱动**: 页面 → 组件 → hooks → 状态 → API
   - **数据驱动**: API → 类型 → 状态 → hooks → 组件 → 页面
3. 识别可复用的现有模式和组件
4. 保持与现有代码风格一致
5. 考虑类型安全和错误处理
</instructions>
</strategy>

<strategy name="修改现有功能">
<instructions>
1. 使用 Grep 定位相关代码
2. 追踪数据流: API → Store → Component → UI
3. 识别副作用: useEffect、事件处理器、订阅
4. 评估影响范围: 局部修改 vs 全局影响
5. 检查是否需要更新类型定义
</instructions>
</strategy>

<strategy name="调试问题">
<debugging_checklist>
1. **React DevTools** - 组件树、props、state、hooks
2. **TanStack Query DevTools** - 查询状态、缓存、网络请求
3. **Network 面板** - API 请求、响应、时序
4. **Console** - 错误堆栈、警告、日志
5. **Redux/Zustand DevTools** - 状态变化历史
6. **源码断点** - 逐步调试执行流程
</debugging_checklist>
</strategy>

## 跨模块交互参考

<cross_module_reference>
<note>
以下内容仅在需要理解跨模块交互时参考。
纯前端开发任务可跳过此部分。
</note>

<web_api_integration>
**Web 与 API 的交互**:
- REST API: `src/lib/api/*.ts` 通过 Axios 调用
- GraphQL: 通过 TanStack Query 查询
- 实时更新: `src/hooks/useRealtime.ts` 监听 Socket.IO

需要详细了解 API 端实现时，查看 `api-before.md`
</web_api_integration>

<web_packages_integration>
**Web 使用共享包**:
- 类型定义: 从 `@intellipick/db/schema` 和 `@intellipick/shared` 导入
- 工具函数: 从 `@intellipick/shared` 导入

需要了解包的详细结构时，查看 `packages-before.md`
</web_packages_integration>
</cross_module_reference>

## 关键文件快速参考

<file_reference>
<category name="核心配置">
| 目的 | 文件路径 |
|------|---------|
| 依赖和脚本 | `apps/web/package.json` |
| 构建配置 | `vite.config.ts` 或 `webpack.config.js` |
| TypeScript 配置 | `tsconfig.json` |
| 环境变量 | `.env`, `.env.local` |
</category>

<category name="应用结构">
| 目的 | 文件路径 |
|------|---------|
| 应用入口 | `src/main.tsx` 或 `src/index.tsx` |
| 路由定义 | `src/App.tsx` |
| 全局状态 | `src/store/*.ts` |
| API 客户端 | `src/lib/api.ts`, `src/lib/api/*.ts` |
</category>

<category name="样式系统">
| 目的 | 文件路径 |
|------|---------|
| 全局样式 | `src/styles/globals.css` 或 `src/index.css` |
| Tailwind 配置 | `tailwind.config.js` 或 `tailwind.config.ts` |
| 主题配置 | `src/theme.ts` 或组件库配置文件 |
</category>

<category name="类型定义">
| 目的 | 来源 |
|------|------|
| 共享类型 | Monorepo packages: `@intellipick/shared`, `@intellipick/db` |
| 本地类型 | `src/types/*.ts` |
| API 响应类型 | `src/lib/api/types.ts` |
</category>
</file_reference>

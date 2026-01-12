# Zustand 状态持久化设计方案

**日期**: 2026-01-12
**作者**: Claude
**状态**: 设计完成，待实施

## 概述

为 IntelliPick Web 应用实现完整的用户交互状态持久化，确保用户刷新页面后保持浏览上下文（过滤条件、视图模式、日期范围等）。

## 背景

### 当前状态

`apps/web/src/store/content-home-store.ts` 当前只持久化了部分状态：
- ✅ `filters` - 内容过滤条件
- ✅ `currentPage` - 当前页码
- ❌ `viewMode` - 未持久化
- ❌ `dateRange` - 因 Date 对象序列化问题未持久化
- ❌ `searchQuery` - 未持久化

### 问题

1. **dateRange 未持久化**：用户选择"今天"或"本周"后刷新页面，日期范围丢失
2. **viewMode 未持久化**：用户切换到"详情展示"后刷新，回到"紧凑展示"
3. **Date 序列化问题**：代码注释说"Date objects can't be properly serialized by localStorage"
4. **用户体验差**：刷新页面导致部分状态丢失，打断工作流

### 目标

- 持久化所有用户交互状态（除 searchQuery）
- 正确处理 Date 对象的序列化/反序列化
- 保持向后兼容性
- 优雅的错误降级

## 设计原则

1. **关注点分离**：只持久化用户的交互状态，内容数据由 TanStack Query 管理缓存
2. **类型安全**：使用 TypeScript 确保序列化/反序列化的类型正确性
3. **向后兼容**：通过版本控制和迁移机制处理 schema 变更
4. **优雅降级**：localStorage 失败时不影响应用正常使用

## 架构设计

### 持久化范围

| 状态字段 | 是否持久化 | 原因 |
|---------|-----------|------|
| `filters` | ✅ 是 | 保持内容过滤条件 |
| `viewMode` | ✅ 是 | 保持用户展示偏好 |
| `dateRange` | ✅ 是 | 保持日期范围选择 |
| `currentPage` | ✅ 是 | 保持分页位置 |
| `searchQuery` | ❌ 否 | 避免用户刷新后困惑 |
| `selectedDate` | ❌ 否 | 已由 dateRange 覆盖 |

### 技术选型

- **存储介质**: localStorage（5-10MB 容量足够）
- **序列化方案**: 自定义 storage 适配器
- **版本管理**: 版本号 + 迁移逻辑

### 数据流

```
前端 Store (Date 对象)
    ↓ JSON.stringify (自动转 ISO 字符串)
localStorage ("2026-01-12T00:00:00.000Z")
    ↓ 自定义 getItem (手动恢复)
前端 Store (Date 对象)
```

## 详细实现

### 1. content-home-store.ts 修改

**文件路径**: `apps/web/src/store/content-home-store.ts`

**核心改动**：

```typescript
export const useContentHomeStore = create<ContentHomeState>()(
  persist(
    (set) => ({
      // Initial state
      selectedDate: new Date(),
      dateRange: { from: undefined, to: undefined },
      filters: {},
      viewMode: "compact",
      currentPage: 1,
      searchQuery: "",

      // Actions (保持不变)
      // ...
    }),
    {
      name: "intellipick-content-home-storage",
      version: 3, // 升级版本号

      // 自定义 storage 处理 Date 序列化
      storage: {
        getItem: (name) => {
          if (!isLocalStorageAvailable()) {
            console.warn("localStorage is not available, using default state");
            return null;
          }

          try {
            const str = localStorage.getItem(name);
            if (!str) return null;

            const { state, version } = JSON.parse(str);

            // 验证数据结构
            if (!state || typeof state !== "object") {
              console.warn("Invalid state structure, resetting to default");
              return null;
            }

            // 版本迁移
            let migratedState = state;
            if (!version || version < 3) {
              migratedState = {
                filters: state?.filters || {},
                viewMode: state?.viewMode || "compact",
                dateRange: { from: undefined, to: undefined },
                currentPage: state?.currentPage || 1,
              };
            }

            // 恢复 Date 对象，带验证
            if (migratedState?.dateRange) {
              const from = migratedState.dateRange.from;
              const to = migratedState.dateRange.to;

              migratedState.dateRange = {
                from: from && !isNaN(new Date(from).getTime())
                  ? new Date(from)
                  : undefined,
                to: to && !isNaN(new Date(to).getTime())
                  ? new Date(to)
                  : undefined,
              };
            }

            return { state: migratedState, version: 3 };

          } catch (error) {
            console.error("Failed to parse persisted state:", error);
            // 清理损坏数据
            try {
              localStorage.removeItem(name);
            } catch {}
            return null;
          }
        },

        setItem: (name, value) => {
          if (!isLocalStorageAvailable()) {
            return; // 静默失败
          }

          try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(name, serialized);
          } catch (error) {
            // 配额超限或其他错误
            if (error instanceof DOMException && error.name === "QuotaExceededError") {
              console.error("localStorage quota exceeded, clearing old data");
              try {
                localStorage.removeItem(name);
              } catch {}
            } else {
              console.error("Failed to persist state:", error);
            }
          }
        },

        removeItem: (name) => {
          if (!isLocalStorageAvailable()) {
            return;
          }

          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error("Failed to remove persisted state:", error);
          }
        },
      },

      // 选择性持久化
      partialize: (state) => ({
        filters: state.filters,
        viewMode: state.viewMode,
        dateRange: state.dateRange, // 现在可以持久化了
        currentPage: state.currentPage,
        // searchQuery 不持久化
        // selectedDate 不持久化
      }),
    }
  )
);

// 工具函数：检测 localStorage 可用性
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
```

### 2. 版本历史

| 版本 | 持久化字段 | 变更说明 |
|-----|----------|---------|
| v1 | `filters`, `currentPage` | 初始版本 |
| v2 | `filters`, `currentPage` | 添加迁移逻辑清理旧数据 |
| v3 | `filters`, `viewMode`, `dateRange`, `currentPage` | 新增 viewMode 和 dateRange 持久化 |

### 3. 迁移逻辑

**从 v1/v2 迁移到 v3**：

```typescript
if (!version || version < 3) {
  migratedState = {
    filters: state?.filters || {},           // 保留
    viewMode: state?.viewMode || "compact",  // 默认值
    dateRange: { from: undefined, to: undefined }, // 重置
    currentPage: state?.currentPage || 1,    // 保留
  };
}
```

**迁移行为**：
- 保留 `filters` 和 `currentPage`（用户的核心过滤条件）
- `viewMode` 设为默认值 `"compact"`
- `dateRange` 重置为"全部"（避免旧数据导致的意外过滤）

### 4. 错误处理

| 错误场景 | 处理方式 | 用户体验 |
|---------|---------|---------|
| localStorage 不可用 | 返回 null，使用内存状态 | 每次刷新重置状态 |
| JSON 解析失败 | 清理损坏数据，返回 null | 使用默认状态 |
| Date 字符串无效 | 设为 undefined | 日期范围重置为"全部" |
| 配额超限 | 清理旧数据，静默失败 | 后续操作不持久化 |
| 结构验证失败 | 返回 null | 使用默认状态 |

**降级策略**：
- 所有错误都不会导致应用崩溃
- 错误在控制台输出，便于调试
- 损坏数据自动清理
- 优雅降级到默认状态

## 测试验证

### 测试清单

```typescript
// 1. 基本持久化测试
✓ 设置 filters，刷新页面，验证 filters 保持
✓ 切换 viewMode，刷新页面，验证 viewMode 保持
✓ 选择日期范围，刷新页面，验证 dateRange 保持
✓ 翻页，刷新页面，验证 currentPage 保持
✓ 搜索内容，刷新页面，验证 searchQuery 被清空

// 2. Date 序列化测试
✓ 设置"今天"，刷新，验证日期范围正确
✓ 设置"本周"，刷新，验证起止时间正确
✓ 自定义日期范围，刷新，验证精确到毫秒

// 3. 版本迁移测试
✓ 模拟 v1 数据，刷新，验证迁移到 v3
✓ 模拟 v2 数据，刷新，验证迁移到 v3
✓ 清空 localStorage，刷新，验证使用默认状态

// 4. 错误处理测试
✓ localStorage 禁用，验证应用正常运行
✓ 存储损坏 JSON，验证自动清理并恢复
✓ 无效 Date 字符串，验证降级为 undefined
✓ localStorage 配额满，验证静默失败
```

### 测试用例示例

#### 用例 1: Date 序列化测试

```typescript
// 1. 设置日期范围
setDateRange({
  from: new Date("2026-01-12T00:00:00.000Z"),
  to: new Date("2026-01-12T23:59:59.999Z")
});

// 2. 检查 localStorage
const stored = JSON.parse(localStorage.getItem("intellipick-content-home-storage"));
expect(stored.state.dateRange.from).toBe("2026-01-12T00:00:00.000Z");
expect(stored.state.dateRange.to).toBe("2026-01-12T23:59:59.999Z");

// 3. 刷新页面
location.reload();

// 4. 验证恢复
const { dateRange } = useContentHomeStore.getState();
expect(dateRange.from).toBeInstanceOf(Date);
expect(dateRange.from?.toISOString()).toBe("2026-01-12T00:00:00.000Z");
expect(dateRange.to?.toISOString()).toBe("2026-01-12T23:59:59.999Z");
```

#### 用例 2: 版本迁移测试

```typescript
// 1. 模拟 v2 数据
localStorage.setItem("intellipick-content-home-storage", JSON.stringify({
  state: {
    filters: { category: "技术" },
    currentPage: 2
  },
  version: 2
}));

// 2. 刷新页面
location.reload();

// 3. 验证迁移
const state = useContentHomeStore.getState();
expect(state.filters.category).toBe("技术");
expect(state.currentPage).toBe(2);
expect(state.viewMode).toBe("compact"); // 默认值
expect(state.dateRange).toEqual({ from: undefined, to: undefined }); // 重置
```

## 实施计划

### Phase 1: 代码实现（1 天）

1. 修改 `apps/web/src/store/content-home-store.ts`
   - 实现自定义 storage
   - 添加 dateRange 和 viewMode 到 partialize
   - 升级 version 到 3
   - 添加迁移逻辑和错误处理

2. 添加 `isLocalStorageAvailable` 工具函数

### Phase 2: 测试验证（0.5 天）

1. 本地开发环境测试所有场景
2. 清理浏览器缓存测试首次访问
3. 模拟旧版本数据测试迁移
4. 模拟错误场景测试降级

### Phase 3: 部署上线（0.5 天）

1. 合并代码到 dev 分支
2. 部署到生产环境
3. 监控控制台错误日志
4. 收集用户反馈

**总工时**: 2 天

### 回滚计划

如果出现严重问题：
1. 将 version 改回 2
2. 移除 dateRange 和 viewMode 持久化
3. 提供清理工具清空用户 localStorage
4. 回滚代码到上一个稳定版本

## 收益

### 用户体验提升

- ✅ 刷新页面保持所有筛选条件
- ✅ 保持视图模式偏好
- ✅ 保持选择的日期范围
- ✅ 避免意外的搜索结果困惑

### 技术优势

- ✅ 类型安全的序列化/反序列化
- ✅ 向后兼容的版本迁移
- ✅ 优雅的错误降级
- ✅ 易于扩展和维护
- ✅ 无需引入额外依赖

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| localStorage 不可用 | 中 | 优雅降级到内存状态 |
| 数据迁移失败 | 低 | 验证逻辑，失败时重置 |
| Date 序列化错误 | 低 | 验证 Date 有效性 |
| 配额超限 | 低 | 自动清理，静默失败 |
| 用户困惑（状态保持） | 低 | 文档说明，提供清理按钮 |

## 未来扩展

### 可能的优化

1. **添加清理按钮**：在设置中提供"清除缓存"按钮
2. **状态同步**：跨标签页同步状态（使用 BroadcastChannel）
3. **部分持久化控制**：允许用户选择哪些状态需要持久化
4. **IndexedDB 支持**：未来如需存储更大数据量时迁移

### ui-store.ts 处理

当前 `ui-store.ts` 似乎未被使用，建议：
1. 确认是否还在使用
2. 如果未使用，删除该文件
3. 如果使用，应用相同的持久化策略

## 参考资料

- [Zustand Persist Middleware](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Date.prototype.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- IntelliPick 时区处理文档: `docs/timezone-handling.md`

## 附录：localStorage 数据示例

### v3 格式（新版本）

```json
{
  "state": {
    "filters": {
      "category": "技术",
      "tags": ["AI", "LLM"],
      "sourceIds": ["rss-001"],
      "entityIds": []
    },
    "viewMode": "detailed",
    "dateRange": {
      "from": "2026-01-12T00:00:00.000Z",
      "to": "2026-01-12T23:59:59.999Z"
    },
    "currentPage": 1
  },
  "version": 3
}
```

### v2 格式（旧版本）

```json
{
  "state": {
    "filters": {
      "category": "技术"
    },
    "currentPage": 2
  },
  "version": 2
}
```

---

**设计完成日期**: 2026-01-12
**待审核**: 等待用户确认后进入实施阶段

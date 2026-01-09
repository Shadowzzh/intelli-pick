# IntelliPick 前端页面规划（Page 2-4）

> 本文档记录 Page 2-4 的设计规划，等待 Page 1 完成后实现

## 参考文档

- **前端数据展示规范**：`docs/plans/2026-01-09-frontend-data-display.md`
- **API 需求文档**：`docs/plans/2026-01-09-api-requirements.md`
- **Page 1 实现计划**：`docs/plans/2026-01-09-page1-content-home-implementation.md`

---

## Page 2: 发现趋势（探索者）

### 业务目标

帮助用户了解当前行业热点，发现正在被频繁讨论的实体（产品、公司、技术），追踪趋势变化。

### 页面布局

**3栏布局（与 Page 1 类似）：**

**左栏（20%）- 筛选器：**
- 日期选择器（CalendarWidget）- 复用
- 日期范围选择器（DateRangeWidget）- 复用
- 实体类型筛选（公司/人物/产品/技术）
- 时间维度筛选（今天/本周/本月/自定义）

**中栏（40%）- 趋势展示：**
- 实体趋势图表（时间轴可视化）
- 热度变化曲线
- 相关内容时间线

**右栏（20%）- 辅助信息：**
- 热门实体榜单（TrendingEntitiesWidget）- 复用
- 新兴实体（最近出现的实体）
- 趋势分类

### 核心组件

**1. EntityTrendChart** - 实体趋势图表
- X轴：时间
- Y轴：热度（提及次数）
- 支持多实体对比
- 交互式缩放和悬停

**2. EntityFilterWidget** - 实体类型筛选
- Checkbox 组
- 按实体类型分组

**3. RisingEntitiesWidget** - 新兴实体
- 显示最近出现的实体
- 标注"新"标识
- 按首次出现时间排序

**4. EntityTimeline** - 实体相关内容时间线
- 按时间展示提及该实体的内容
- 显示提及上下文

### API 需求

需要新增的 API：
- `GET /api/v1/entities/:id/trend?from=&to=` - 实体趋势数据
- `GET /api/v1/entities/rising?limit=10` - 新兴实体列表
- `GET /api/v1/entities/:id/contents?from=&to=` - 实体相关内容（已定义）

### 复用组件

- CalendarWidget - 复用 Page 1
- DateRangeWidget - 复用 Page 1
- TrendingEntitiesWidget - 复用 Page 1
- Widget 容器 - 复用 Page 1

---

## Page 3: 深度搜索（研究者）

### 业务目标

当用户有明确的信息需求时，能够快速找到相关内容，支持关键词搜索和多维度筛选。

### 页面布局

**搜索为主，筛选为辅：**

**顶部区域：**
- 搜索输入框（大号，居中）
- 搜索建议/自动完成
- 高级筛选切换按钮

**中栏（60%）- 搜索结果：**
- 搜索结果列表（复用 ContentListNew）
- 关键词高亮
- 相关性得分
- 搜索结果统计

**左栏（20%）- 高级筛选：**
- 分类筛选（复用 CategoryNavWidget）
- 标签筛选（复用 TagFilterWidget）
- 数据源筛选（复用 SourceFilterWidget）
- 日期筛选
- 实体筛选

**右栏（20%）- 搜索辅助：**
- 热门搜索词
- 搜索历史
- 相关搜索建议
- 实体筛选（复用）

### 核心组件

**1. SearchBox** - 搜索输入框
- 大号输入框
- 搜索图标
- 自动完成建议
- 搜索历史下拉

**2. SearchFilters** - 高级筛选面板
- 可折叠/展开
- 多维度筛选
- 快捷筛选预设

**3. SearchResults** - 搜索结果列表
- 基于 ContentListNew 扩展
- 关键词高亮
- 相关性排序
- 按来源/时间/相关度排序

**4. TrendingSearchesWidget** - 热门搜索
- 显示热门搜索词
- 点击直接搜索

**5. SearchHistoryWidget** - 搜索历史
- 最近搜索记录
- 清除历史
- 点击重新搜索

### API 需求

已有 API：
- `POST /api/v1/search` - 搜索功能（已实现）

需要新增：
- `GET /api/v1/search/suggestions?query=` - 搜索建议
- `GET /api/v1/search/trending` - 热门搜索词

### 复用组件

- CategoryNavWidget - 复用 Page 1
- TagFilterWidget - 复用 Page 1
- SourceFilterWidget - 复用 Page 1
- ContentListNew - 扩展支持搜索结果
- Widget 容器 - 复用 Page 1

---

## Page 4: 系统管理（管理员）

### 业务目标

让系统管理员能够监控采集系统的健康状态，管理数据源配置，查看系统运行指标。

### 页面布局

**仪表盘式布局：**

**顶部区域 - 关键指标：**
- 总内容数
- 今日新增
- 总实体数
- 活跃数据源
- 队列状态
- 实时更新提示

**左栏（25%）- 导航菜单：**
- 仪表盘（Dashboard）
- 数据源管理（Sources）
- 队列监控（Queue）
- 系统日志（Logs）
- 配置管理（Config）

**中栏（50%）- 主要内容区：**
- 根据左侧导航显示不同内容
- 默认显示仪表盘

**右栏（25%）- 实时状态：**
- 系统健康度
- 最近错误
- 性能指标

### 核心组件

**仪表盘：**

**1. SystemStatsGrid** - 系统统计卡片
- 总内容数（带趋势）
- 今日新增
- 总实体数
- 活跃数据源
- 队列状态
- 实时更新

**2. SourceHealthWidget** - 数据源健康状态
- 数据源列表
- 健康状态指示器（健康/延迟/故障）
- 最后采集时间
- 采集间隔
- 重新采集按钮

**3. QueueStatsWidget** - 队列状态
- 队列长度
- 处理速度
- 失败任务数
- 重试次数

**4. SystemLogWidget** - 系统日志
- 最近日志
- 错误日志
- 警告日志
- 日志级别筛选

### 数据源管理页面

**1. SourceListWidget** - 数据源列表
- 表格展示
- 启用/禁用切换
- 编辑配置
- 删除数据源
- 添加数据源按钮

**2. SourceForm** - 数据源表单
- 添加/编辑数据源
- 表单验证
- 测试连接按钮

### API 需求

需要新增的 API：
- `GET /api/v1/sources/health` - 数据源健康状态（已定义）
- `GET /api/v1/queue/stats` - 队列状态（已定义）
- `GET /api/v1/stats/trends` - 统计趋势数据
- `GET /api/v1/logs?level=&limit=` - 系统日志
- `PUT /api/v1/sources/:id/toggle` - 启用/禁用数据源
- `POST /api/v1/sources/:id/refetch` - 手动触发采集

### 复用组件

- Widget 容器 - 复用 Page 1
- CalendarWidget - 复用 Page 1（用于日志时间筛选）

---

## 实现优先级建议

### 阶段 1：完成 Page 1（当前）
- ✅ 设计已完成
- ✅ API 需求已定义
- ✅ 实现计划已创建
- 🔄 正在实现中

### 阶段 2：Page 2（发现趋势）
- 优先级：中
- 依赖：Page 1 的组件复用
- 新增功能：实体趋势图表、新兴实体

### 阶段 3：Page 3（深度搜索）
- 优先级：高（用户常用功能）
- 依赖：Page 1 的内容列表和筛选器
- 新增功能：搜索框、搜索建议、搜索结果

### 阶段 4：Page 4（系统管理）
- 优先级：低（管理员功能）
- 依赖：后端 API 支持
- 新增功能：仪表盘、数据源管理、队列监控

---

## 设计原则

### 与 Page 1 保持一致

1. **视觉风格一致**
   - 使用相同的 Widget 容器
   - 使用相同的配色方案
   - 使用相同的卡片样式

2. **交互模式一致**
   - 日期筛选：复用 CalendarWidget + DateRangeWidget
   - 筛选器：复用 CategoryNavWidget、TagFilterWidget 等
   - 列表展示：复用 ContentListNew 或其变体

3. **状态管理一致**
   - 使用 Zustand store
   - 使用 React Query 数据获取
   - 使用相同的错误处理模式

### 渐进式实现

1. **先实现核心功能**
   - Page 2: 实体趋势图表
   - Page 3: 搜索框 + 搜索结果
   - Page 4: 仪表盘

2. **逐步完善**
   - 第一版：基本功能
   - 第二版：高级筛选
   - 第三版：可视化和交互优化

3. **持续优化**
   - 根据用户反馈调整
   - 性能优化
   - 用户体验优化

---

## 下一步

当 Page 1 实现完成后：

1. **评审 Page 1 的实现**
   - 总结经验教训
   - 收集可复用的组件
   - 优化开发流程

2. **选择下一个页面**
   - 根据用户需求优先级
   - 根据技术依赖关系
   - 根据资源可用性

3. **创建详细实现计划**
   - 参考 Page 1 的计划格式
   - 定义明确的任务
   - 设置验收标准

---

**创建时间：** 2025-01-09
**状态：** 规划中，等待 Page 1 完成后实施

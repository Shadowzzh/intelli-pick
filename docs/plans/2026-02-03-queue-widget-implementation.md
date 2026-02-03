# QueueDetailWidget 重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 QueueDetailWidget 从 Tabs 模式重构为筛选器 + 表格 + 无限滚动模式

**Architecture:**
- 移除冗余的状态卡片、进度条和 Worker 状态
- 使用 shadcn Select 组件实现状态筛选器
- 使用表格展示任务列表，react-intersection-observer 实现无限滚动
- 使用 shadcn Dialog 展示任务详情

**Tech Stack:**
- React 18 + TypeScript
- TanStack Query (数据获取)
- shadcn/ui (Dialog, Badge, Button, Skeleton)
- react-intersection-observer (无限滚动)
- date-fns (时间格式化)

---

## Task 1: 安装必要依赖

**Files:**
- Modify: `apps/web/package.json`

**Step 1: 安装 react-intersection-observer**

```bash
cd apps/web
pnpm add react-intersection-observer
```

Expected: package.json 中新增依赖

**Step 2: 安装 shadcn Select 组件（如未安装）**

```bash
cd apps/web
npx shadcn@latest add select
```

Expected: `apps/web/src/components/ui/select.tsx` 文件创建成功

**Step 3: 验证安装**

```bash
cd apps/web
pnpm typecheck
```

Expected: 类型检查通过，无错误

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/src/components/ui/select.tsx pnpm-lock.yaml
git commit -m "chore: 安装 react-intersection-observer 和 shadcn Select 组件"
```

---

## Task 2: 创建状态筛选器组件

**Files:**
- Create: `apps/web/src/components/monitoring/StatusFilterBar.tsx`

**Step 1: 创建组件文件**

```tsx
// apps/web/src/components/monitoring/StatusFilterBar.tsx
import type { JobStatus } from "@intellipick/shared";

interface StatusFilterBarProps {
	value: JobStatus | "all";
	onChange: (value: JobStatus | "all") => void;
}

const STATUS_OPTIONS = [
	{ value: "all" as const, label: "全部" },
	{ value: "waiting" as const, label: "等待中" },
	{ value: "active" as const, label: "处理中" },
	{ value: "completed" as const, label: "已完成" },
	{ value: "failed" as const, label: "失败" },
	{ value: "delayed" as const, label: "延迟" },
];

export function StatusFilterBar({ value, onChange }: StatusFilterBarProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">状态:</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value as JobStatus | "all")}
				className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				{STATUS_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
```

**Step 2: 导出组件**

```bash
# 验证文件已创建
cat apps/web/src/components/monitoring/StatusFilterBar.tsx
```

Expected: 文件内容正确

**Step 3: Commit**

```bash
git add apps/web/src/components/monitoring/StatusFilterBar.tsx
git commit -m "feat: 创建 StatusFilterBar 状态筛选器组件"
```

---

## Task 3: 创建任务表格组件

**Files:**
- Create: `apps/web/src/components/monitoring/JobsTable.tsx`

**Step 1: 创建表格组件**

```tsx
// apps/web/src/components/monitoring/JobsTable.tsx
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueJob } from "@intellipick/shared";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useRef } from "react";

interface JobsTableProps {
	jobs: QueueJob[];
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	onJobClick: (job: QueueJob) => void;
	onLoadMore: () => void;
}

export function JobsTable({
	jobs,
	isLoading,
	isLoadingMore,
	hasMore,
	onJobClick,
	onLoadMore,
}: JobsTableProps) {
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const getStatusBadge = (job: QueueJob) => {
		let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
		let colorClass = "";

		if (job.failedReason) {
			variant = "destructive";
			colorClass = "bg-red-500/10 text-red-700";
		} else if (job.finishedOn) {
			colorClass = "bg-green-500/10 text-green-700";
		} else if (job.processedOn) {
			colorClass = "bg-orange-500/10 text-orange-700";
		} else {
			colorClass = "bg-blue-500/10 text-blue-700";
		}

		let statusLabel = "等待中";
		if (job.failedReason) statusLabel = "失败";
		else if (job.finishedOn) statusLabel = "已完成";
		else if (job.processedOn) statusLabel = "处理中";

		return (
			<Badge variant={variant} className={colorClass}>
				{statusLabel}
			</Badge>
		);
	};

	// 设置 Intersection Observer
	if (typeof window !== "undefined" && loadMoreRef.current) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					onLoadMore();
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(loadMoreRef.current);

		return () => observer.disconnect();
	}

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="p-4 border-b">
						<Skeleton className="h-16 w-full" />
					</div>
				))}
			</div>
		);
	}

	if (jobs.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				暂无符合条件的任务
			</div>
		);
	}

	return (
		<div className="w-full">
			{/* 表头 */}
			<div className="grid grid-cols-[120px_100px_1fr_160px_80px] gap-2 px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
				<div>任务ID</div>
				<div>状态</div>
				<div>数据摘要</div>
				<div>创建时间</div>
				<div>操作</div>
			</div>

			{/* 表格内容 */}
			<div className="divide-y">
				{jobs.map((job) => (
					<div
						key={job.id}
						onClick={() => onJobClick(job)}
						className="grid grid-cols-[120px_100px_1fr_160px_80px] gap-2 px-4 py-3 hover:bg-accent/50 cursor-pointer items-center"
					>
						{/* 任务ID */}
						<div className="text-xs font-mono truncate" title={job.id || undefined}>
							{job.id?.slice(0, 8) || "N/A"}
						</div>

						{/* 状态 */}
						<div>{getStatusBadge(job)}</div>

						{/* 数据摘要 */}
						<div className="text-sm truncate">
							{job.data ? JSON.stringify(job.data).slice(0, 100) : "N/A"}
						</div>

						{/* 创建时间 */}
						<div className="text-xs text-muted-foreground">
							{job.timestamp
								? formatDistanceToNow(new Date(job.timestamp), {
										addSuffix: true,
										locale: zhCN,
								  })
								: "N/A"}
						</div>

						{/* 操作 */}
						<div>
							<button
								className="text-xs text-primary hover:underline"
								onClick={(e) => {
									e.stopPropagation();
									onJobClick(job);
								}}
							>
								详情
							</button>
						</div>
					</div>
				))}
			</div>

			{/* 加载更多触发器 */}
			<div ref={loadMoreRef} className="py-4 text-center text-sm text-muted-foreground">
				{isLoadingMore && "🔄 加载更多..."}
				{!hasMore && jobs.length > 0 && "✅ 已加载全部任务"}
			</div>
		</div>
	);
}
```

**Step 2: 验证文件创建**

```bash
cat apps/web/src/components/monitoring/JobsTable.tsx | head -20
```

Expected: 文件内容正确

**Step 3: Commit**

```bash
git add apps/web/src/components/monitoring/JobsTable.tsx
git commit -m "feat: 创建 JobsTable 任务表格组件，支持无限滚动"
```

---

## Task 4: 重构 QueueDetailWidget 主组件

**Files:**
- Modify: `apps/web/src/components/monitoring/QueueDetailWidget.tsx`

**Step 1: 备份原文件**

```bash
cp apps/web/src/components/monitoring/QueueDetailWidget.tsx apps/web/src/components/monitoring/QueueDetailWidget.tsx.bak
```

**Step 2: 重写组件**

```tsx
import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import { useQueueJobs } from "@/hooks/useQueueJobs";
import type { JobStatus, QueueStatsResponseData } from "@intellipick/shared";
import { Layers } from "lucide-react";
import { useState } from "react";
import { JobDetailDialog } from "./JobDetailDialog";
import { JobsTable } from "./JobsTable";
import { StatusFilterBar } from "./StatusFilterBar";

interface QueueDetailWidgetProps {
	data?: QueueStatsResponseData;
}

export function QueueDetailWidget({ data }: QueueDetailWidgetProps) {
	const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
	const [page, setPage] = useState(0);
	const [allJobs, setAllJobs] = useState<any[]>([]);
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const pageSize = 20;

	// 获取任务列表
	const { data: jobs, isLoading, isFetching } = useQueueJobs(
		statusFilter === "all" ? ("waiting" as JobStatus) : (statusFilter as JobStatus),
		page * pageSize,
		(page + 1) * pageSize - 1
	);

	// 累加数据
	if (jobs && (!isFetching || page === 0)) {
		if (page === 0) {
			setAllJobs(jobs);
		} else {
			setAllJobs((prev) => {
				const newJobs = jobs.filter((j) => !prev.some((p) => p.id === j.id));
				return [...prev, ...newJobs];
			});
		}
	}

	if (!data || !data.queues || data.queues.length === 0) {
		return (
			<Widget title="队列详情" icon={<Layers className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无队列数据" iconType="default" />
			</Widget>
		);
	}

	const queue = data.queues[0];

	// 筛选切换处理
	const handleStatusChange = (newStatus: JobStatus | "all") => {
		setStatusFilter(newStatus);
		setPage(0);
		setAllJobs([]);
	};

	// 加载更多
	const handleLoadMore = () => {
		if (!isFetching) {
			setPage((prev) => prev + 1);
		}
	};

	// 任务点击
	const handleJobClick = (job: any) => {
		setSelectedJobId(job.id || null);
	};

	return (
		<>
			<Widget
				title="队列详情"
				icon={<Layers className="h-4 w-4" />}
				actions={
					<div className="flex items-center gap-4">
						<StatusFilterBar value={statusFilter} onChange={handleStatusChange} />
						<Badge variant="outline">{queue.name}</Badge>
					</div>
				}
			>
				<JobsTable
					jobs={allJobs}
					isLoading={isLoading && page === 0}
					isLoadingMore={isFetching && page > 0}
					hasMore={jobs?.length === pageSize}
					onJobClick={handleJobClick}
					onLoadMore={handleLoadMore}
				/>
			</Widget>

			<JobDetailDialog
				jobId={selectedJobId}
				open={!!selectedJobId}
				onOpenChange={(open) => !open && setSelectedJobId(null)}
			/>
		</>
	);
}
```

**Step 3: 修复类型错误**

由于上面的实现有类型问题，让我修正：

```tsx
import { Badge } from "@/components/ui/badge";
import { Widget } from "@/components/widgets/Widget";
import { WidgetEmptyState } from "@/components/widgets/WidgetEmptyState";
import type { JobStatus, QueueJob, QueueStatsResponseData } from "@intellipick/shared";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { JobDetailDialog } from "./JobDetailDialog";
import { JobsTable } from "./JobsTable";
import { StatusFilterBar } from "./StatusFilterBar";

interface QueueDetailWidgetProps {
	data?: QueueStatsResponseData;
}

export function QueueDetailWidget({ data }: QueueDetailWidgetProps) {
	const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
	const [page, setPage] = useState(0);
	const [allJobs, setAllJobs] = useState<QueueJob[]>([]);
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const pageSize = 20;

	// 获取任务列表
	const { data: jobs, isLoading, isFetching } = useQueueJobs(
		statusFilter === "all" ? ("waiting" as JobStatus) : (statusFilter as JobStatus),
		page * pageSize,
		(page + 1) * pageSize - 1
	);

	// 累加数据
	useEffect(() => {
		if (jobs && !isFetching) {
			if (page === 0) {
				setAllJobs(jobs);
			} else {
				setAllJobs((prev) => {
					const newJobs = jobs.filter((j) => !prev.some((p) => p.id === j.id));
					return [...prev, ...newJobs];
				});
			}
		}
	}, [jobs, isFetching, page]);

	if (!data || !data.queues || data.queues.length === 0) {
		return (
			<Widget title="队列详情" icon={<Layers className="h-4 w-4" />}>
				<WidgetEmptyState message="暂无队列数据" iconType="default" />
			</Widget>
		);
	}

	const queue = data.queues[0];

	// 筛选切换处理
	const handleStatusChange = (newStatus: JobStatus | "all") => {
		setStatusFilter(newStatus);
		setPage(0);
		setAllJobs([]);
	};

	// 加载更多
	const handleLoadMore = () => {
		if (!isFetching) {
			setPage((prev) => prev + 1);
		}
	};

	// 任务点击
	const handleJobClick = (job: QueueJob) => {
		setSelectedJobId(job.id || null);
	};

	return (
		<>
			<Widget
				title="队列详情"
				icon={<Layers className="h-4 w-4" />}
				actions={
					<div className="flex items-center gap-4">
						<StatusFilterBar value={statusFilter} onChange={handleStatusChange} />
						<Badge variant="outline">{queue.name}</Badge>
					</div>
				}
			>
				<JobsTable
					jobs={allJobs}
					isLoading={isLoading && page === 0}
					isLoadingMore={isFetching && page > 0}
					hasMore={jobs?.length === pageSize}
					onJobClick={handleJobClick}
					onLoadMore={handleLoadMore}
				/>
			</Widget>

			<JobDetailDialog
				jobId={selectedJobId}
				open={!!selectedJobId}
				onOpenChange={(open) => !open && setSelectedJobId(null)}
			/>
		</>
	);
}
```

**Step 4: 类型检查**

```bash
cd apps/web
pnpm typecheck
```

Expected: 类型检查通过（可能有一些警告，但无错误）

**Step 5: Commit**

```bash
git add apps/web/src/components/monitoring/QueueDetailWidget.tsx
git rm apps/web/src/components/monitoring/JobCard.tsx
git commit -m "refactor: 重构 QueueDetailWidget 为筛选器+表格模式

- 移除 Tabs、状态卡片、进度条等冗余元素
- 新增 StatusFilterBar 状态筛选器
- 新增 JobsTable 表格组件，支持无限滚动
- 简化组件结构，提升用户体验"
```

---

## Task 5: 优化 Intersection Observer 实现

**Files:**
- Modify: `apps/web/src/components/monitoring/JobsTable.tsx`

**Step 1: 修复 Intersection Observer 实现**

当前实现有问题，Observer 在每次渲染时都会创建。需要使用 useEffect：

```tsx
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
```

修改 JobsTable 组件：

```tsx
// 在组件中使用 useInView hook
const { ref: loadMoreRef, inView } = useInView({
	threshold: 0.1,
	triggerOnce: false,
});

// 当进入视口且还有更多数据时，触发加载
useEffect(() => {
	if (inView && hasMore && !isLoadingMore) {
		onLoadMore();
	}
}, [inView, hasMore, isLoadingMore, onLoadMore]);
```

完整修改：

```tsx
// apps/web/src/components/monitoring/JobsTable.tsx
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueJob } from "@intellipick/shared";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface JobsTableProps {
	jobs: QueueJob[];
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	onJobClick: (job: QueueJob) => void;
	onLoadMore: () => void;
}

export function JobsTable({
	jobs,
	isLoading,
	isLoadingMore,
	hasMore,
	onJobClick,
	onLoadMore,
}: JobsTableProps) {
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	// 当进入视口且还有更多数据时，触发加载
	useEffect(() => {
		if (inView && hasMore && !isLoadingMore) {
			onLoadMore();
		}
	}, [inView, hasMore, isLoadingMore, onLoadMore]);

	const getStatusBadge = (job: QueueJob) => {
		let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
		let colorClass = "";

		if (job.failedReason) {
			variant = "destructive";
			colorClass = "bg-red-500/10 text-red-700";
		} else if (job.finishedOn) {
			colorClass = "bg-green-500/10 text-green-700";
		} else if (job.processedOn) {
			colorClass = "bg-orange-500/10 text-orange-700";
		} else {
			colorClass = "bg-blue-500/10 text-blue-700";
		}

		let statusLabel = "等待中";
		if (job.failedReason) statusLabel = "失败";
		else if (job.finishedOn) statusLabel = "已完成";
		else if (job.processedOn) statusLabel = "处理中";

		return (
			<Badge variant={variant} className={colorClass}>
				{statusLabel}
			</Badge>
		);
	};

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="p-4 border-b">
						<Skeleton className="h-16 w-full" />
					</div>
				))}
			</div>
		);
	}

	if (jobs.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				暂无符合条件的任务
			</div>
		);
	}

	return (
		<div className="w-full">
			{/* 表头 */}
			<div className="grid grid-cols-[120px_100px_1fr_160px_80px] gap-2 px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
				<div>任务ID</div>
				<div>状态</div>
				<div>数据摘要</div>
				<div>创建时间</div>
				<div>操作</div>
			</div>

			{/* 表格内容 */}
			<div className="divide-y">
				{jobs.map((job) => (
					<div
						key={job.id}
						onClick={() => onJobClick(job)}
						className="grid grid-cols-[120px_100px_1fr_160px_80px] gap-2 px-4 py-3 hover:bg-accent/50 cursor-pointer items-center"
					>
						{/* 任务ID */}
						<div className="text-xs font-mono truncate" title={job.id || undefined}>
							{job.id?.slice(0, 8) || "N/A"}
						</div>

						{/* 状态 */}
						<div>{getStatusBadge(job)}</div>

						{/* 数据摘要 */}
						<div className="text-sm truncate">
							{job.data ? JSON.stringify(job.data).slice(0, 100) : "N/A"}
						</div>

						{/* 创建时间 */}
						<div className="text-xs text-muted-foreground">
							{job.timestamp
								? formatDistanceToNow(new Date(job.timestamp), {
										addSuffix: true,
										locale: zhCN,
								  })
								: "N/A"}
						</div>

						{/* 操作 */}
						<div>
							<button
								className="text-xs text-primary hover:underline"
								onClick={(e) => {
									e.stopPropagation();
									onJobClick(job);
								}}
							>
								详情
							</button>
						</div>
					</div>
				))}
			</div>

			{/* 加载更多触发器 */}
			<div ref={loadMoreRef} className="py-4 text-center text-sm text-muted-foreground">
				{isLoadingMore && "🔄 加载更多..."}
				{!hasMore && jobs.length > 0 && "✅ 已加载全部任务"}
			</div>
		</div>
	);
}
```

**Step 2: 验证类型检查**

```bash
cd apps/web
pnpm typecheck
```

Expected: 类型检查通过

**Step 3: Commit**

```bash
git add apps/web/src/components/monitoring/JobsTable.tsx
git commit -m "fix: 修复 JobsTable 的 Intersection Observer 实现

- 使用 react-intersection-observer 的 useInView hook
- 通过 useEffect 正确处理触发加载逻辑
- 避免重复创建 Observer 实例"
```

---

## Task 6: 测试功能

**Files:**
- Test: `apps/web/src/components/monitoring/QueueDetailWidget.tsx`

**Step 1: 启动开发服务器**

```bash
cd apps/web
pnpm dev
```

Expected: 服务器启动在 http://localhost:5173

**Step 2: 手动测试**

1. 打开浏览器访问监控页面
2. 验证状态筛选器显示正常
3. 切换不同状态，验证任务列表更新
4. 滚动到底部，验证自动加载更多
5. 点击任务行，验证详情对话框打开
6. 验证空状态显示

**Step 3: 检查控制台错误**

打开浏览器开发者工具，确认无 JavaScript 错误

**Step 4: 检查网络请求**

验证：
- 初始加载请求任务列表
- 滚动时请求下一页数据
- 筛选切换时重置并重新请求

**Step 5: 记录测试结果**

如有问题，记录并修复；如无问题，继续下一步

---

## Task 7: 清理废弃代码

**Files:**
- Delete: `apps/web/src/components/monitoring/JobCard.tsx`
- Delete: `apps/web/src/components/monitoring/QueueDetailWidget.tsx.bak`

**Step 1: 删除废弃文件**

```bash
git rm apps/web/src/components/monitoring/JobCard.tsx
rm -f apps/web/src/components/monitoring/QueueDetailWidget.tsx.bak
```

**Step 2: 检查是否有其他地方引用 JobCard**

```bash
cd apps/web
grep -r "JobCard" src/ --exclude-dir=node_modules
```

Expected: 无引用（除了已删除的文件）

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: 清理废弃的 JobCard 组件和备份文件"
```

---

## Task 8: 更新文档

**Files:**
- Modify: `docs/plans/2026-02-03-queue-detail-widget-redesign.md`

**Step 1: 标记设计文档为已完成**

在文档末尾添加：

```markdown
---

## 实施状态

✅ 已完成实施 - 2026-02-03

实施计划: `docs/plans/2026-02-03-queue-widget-implementation.md`

实施变更:
- 安装 react-intersection-observer 和 shadcn Select 组件
- 创建 StatusFilterBar 状态筛选器组件
- 创建 JobsTable 表格组件，支持无限滚动
- 重构 QueueDetailWidget 主组件
- 移除 JobCard、Tabs、状态卡片等废弃代码

测试结果: ✅ 通过
```

**Step 2: Commit**

```bash
git add docs/plans/2026-02-03-queue-detail-widget-redesign.md
git commit -m "docs: 标记队列详情重构为已完成"
```

---

## Task 9: 最终验证和提交

**Files:**
- Test: 完整功能验证

**Step 1: 完整类型检查**

```bash
pnpm typecheck
```

Expected: 所有类型检查通过

**Step 2: 完整构建**

```bash
pnpm build
```

Expected: 构建成功，无错误

**Step 3: 最终功能测试**

重复 Task 6 的手动测试步骤，确保所有功能正常

**Step 4: 查看变更摘要**

```bash
git diff master --stat
```

Expected: 显示所有修改的文件列表

**Step 5: 创建最终提交**

```bash
git add -A
git commit -m "feat: 完成队列详情组件重构

核心变更:
- ✅ 移除冗余的状态卡片、进度条和 Worker 状态
- ✅ 新增状态筛选器，支持按状态过滤任务
- ✅ 使用表格展示任务列表，更紧凑清晰
- ✅ 实现无限滚动加载，流畅浏览大量任务
- ✅ 保留任务详情对话框，功能完整

技术实现:
- 使用 shadcn Select 组件实现筛选器
- 使用 react-intersection-observer 实现无限滚动
- 使用 TanStack Query 管理数据状态
- 移除 JobCard 组件，改为表格行展示

测试: ✅ 通过
文档: docs/plans/2026-02-03-queue-detail-widget-redesign.md"
```

---

## 实施完成检查清单

- [ ] 所有依赖安装完成
- [ ] StatusFilterBar 组件创建并测试通过
- [ ] JobsTable 组件创建并测试通过
- [ ] QueueDetailWidget 重构完成
- [ ] 无限滚动功能正常工作
- [ ] 状态筛选功能正常工作
- [ ] 任务详情对话框正常工作
- [ ] 所有类型检查通过
- [ ] 构建成功无错误
- [ ] 手动功能测试通过
- [ ] 废弃代码已清理
- [ ] 文档已更新
- [ ] 所有变更已提交到 git

---

## 已知问题和后续优化

1. **API 限制**: 当前 API 使用 `start` 和 `end` 参数，可能需要改用 `offset` 和 `limit`
2. **去重逻辑**: 客户端去重可能不够高效，考虑服务端优化
3. **缓存策略**: TanStack Query 缓存策略可能需要调整
4. **性能优化**: 大量数据时考虑虚拟滚动
5. **错误处理**: 增强加载失败的重试和错误提示

---

## 参考资料

- 设计文档: `docs/plans/2026-02-03-queue-detail-widget-redesign.md`
- shadcn/ui 文档: https://ui.shadcn.com/
- react-intersection-observer: https://github.com/thebuilder/react-intersection-observer
- TanStack Query: https://tanstack.com/query/latest

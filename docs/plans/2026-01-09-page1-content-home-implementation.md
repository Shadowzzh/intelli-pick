# Page 1 Content Homepage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Page 1 Content Homepage with 3-column widget layout, date filtering, and real-time updates for the IntelliPick web application.

**Architecture:**
- Widget-based component system with reusable container components
- Zustand for global state (date selection, filters, view mode)
- React Query for data fetching with automatic cache invalidation on date changes
- Socket.IO for real-time content updates
- Tailwind CSS v4 with shadcn/ui components for styling

**Tech Stack:**
- React 18 with TypeScript
- Zustand (state management)
- React Query (@tanstack/react-query)
- React Router (navigation)
- Socket.IO Client (real-time)
- Tailwind CSS v4
- shadcn/ui (component library)
- date-fns (date utilities)
- Axios (HTTP client)

**Reference Documents:**
- Frontend data display spec: `docs/plans/2026-01-09-frontend-data-display.md`
- API requirements: `docs/plans/2026-01-09-api-requirements.md`
- Test page design: `apps/web/src/pages/TestPage.tsx`

---

## Phase 1: Foundation & Widget System

### Task 1.1: Install Required Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Check current dependencies**

Run: `cd apps/web && pnpm list date-fns lucide-react`

Expected: Check if packages are already installed

**Step 2: Install missing dependencies**

Run: `cd apps/web && pnpm add date-fns lucide-react clsx tailwind-merge`

Expected: All dependencies installed successfully

**Step 3: Verify installation**

Run: `cd apps/web && pnpm list date-fns lucide-react clsx tailwind-merge`

Expected: Shows installed versions

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat(web): install date-fns and lucide-react dependencies"
```

---

### Task 1.2: Create Content Home Page Store

**Files:**
- Create: `apps/web/src/store/content-home-store.ts`

**Step 1: Write the store implementation**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ContentFilters {
  category?: string;
  sourceIds?: string[];
  tags?: string[];
}

type ViewMode = "compact" | "detailed";

interface ContentHomeState {
  // Date state
  selectedDate: Date;
  dateRange: DateRange;

  // Filters
  filters: ContentFilters;

  // View mode
  viewMode: ViewMode;

  // Actions
  setSelectedDate: (date: Date) => void;
  setDateRange: (range: DateRange) => void;
  setFilters: (filters: Partial<ContentFilters>) => void;
  setViewMode: (mode: ViewMode) => void;
  resetFilters: () => void;
}

export const useContentHomeStore = create<ContentHomeState>()(
  persist(
    (set) => ({
      // Initial state - today's date
      selectedDate: new Date(),
      dateRange: { from: undefined, to: undefined },

      // No filters by default
      filters: {},

      // Default view mode
      viewMode: "compact",

      // Actions
      setSelectedDate: (date) => set({ selectedDate: date }),

      setDateRange: (range) => set({ dateRange: range }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      setViewMode: (mode) => set({ viewMode: mode }),

      resetFilters: () =>
        set({
          filters: {},
        }),
    }),
    {
      name: "intellipick-content-home-storage",
      // Only persist selected date and filters, not view mode
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        dateRange: state.dateRange,
        filters: state.filters,
      }),
    },
  ),
);
```

**Step 2: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/src/store/content-home-store.ts
git commit -m "feat(web): create content home page store with date and filter state"
```

---

### Task 1.3: Create Reusable Widget Container Component

**Files:**
- Create: `apps/web/src/components/widgets/Widget.tsx`
- Create: `apps/web/src/components/widgets/index.ts`

**Step 1: Write the Widget component**

```typescript
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface WidgetProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Widget({
  title,
  icon,
  actions,
  className,
  children,
}: WidgetProps) {
  return (
    <div
      className={cn(
        "widget rounded-lg border bg-card text-card-foreground overflow-hidden",
        className,
      )}
    >
      {/* Widget Header */}
      <div className="widget-header flex items-center justify-between gap-2 px-4 py-3 border-b">
        <div className="flex items-center gap-2 font-medium">
          {icon && <span className="widget-icon">{icon}</span>}
          <span>{title}</span>
        </div>
        {actions && <div className="widget-actions">{actions}</div>}
      </div>

      {/* Widget Content */}
      <div className="widget-content p-4 overflow-auto">{children}</div>
    </div>
  );
}
```

**Step 2: Create widget barrel export**

```typescript
export { Widget } from "./Widget";
export type { WidgetProps } from "./Widget";
```

**Step 3: Add widget styles to global CSS**

**File:** `apps/web/src/index.css`

Add to the end of the file:
```css
/* Widget styles */
.widget {
  transition: all 0.2s ease-in-out;
}

.widget:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .widget:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
```

**Step 4: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 5: Commit**

```bash
git add apps/web/src/components/widgets/ apps/web/src/index.css
git commit -m "feat(web): add reusable Widget container component"
```

---

### Task 1.4: Create Widget Skeleton Loading Component

**Files:**
- Create: `apps/web/src/components/widgets/WidgetSkeleton.tsx`

**Step 1: Write the skeleton component**

```typescript
import { cn } from "@/lib/utils";

export interface WidgetSkeletonProps {
  className?: string;
  lines?: number;
}

export function WidgetSkeleton({ className, lines = 3 }: WidgetSkeletonProps) {
  return (
    <div className={cn("widget rounded-lg border bg-card", className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-muted animate-pulse rounded" />
            <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

```typescript
export { Widget } from "./Widget";
export type { WidgetProps } from "./Widget";
export { WidgetSkeleton } from "./WidgetSkeleton";
export type { WidgetSkeletonProps } from "./WidgetSkeleton";
```

**Step 3: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 4: Commit**

```bash
git add apps/web/src/components/widgets/
git commit -m "feat(web): add WidgetSkeleton loading component"
```

---

### Task 1.5: Create Column Layout Component

**Files:**
- Create: `apps/web/src/components/layout/Column.tsx`

**Step 1: Write the Column component**

```typescript
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ColumnProps {
  children: ReactNode;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Column({ children, size = "medium", className }: ColumnProps) {
  const sizeClasses = {
    small: "w-1/5 min-w-[200px]",
    medium: "w-2/5 min-w-[400px]",
    large: "w-3/5 min-w-[600px]",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
```

**Step 2: Update layout barrel export**

**File:** `apps/web/src/components/layout/index.ts`

Create or update:
```typescript
export { AppLayout } from "./AppLayout";
export { GridColumn } from "./GridColumn";
export { Column } from "./Column";
```

**Step 3: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 4: Commit**

```bash
git add apps/web/src/components/layout/
git commit -m "feat(web): add Column layout component for widget grid"
```

---

### Task 1.6: Create Content Home Page Component

**Files:**
- Create: `apps/web/src/pages/ContentHomePage.tsx`

**Step 1: Write the page component structure**

```typescript
import { Column } from "@/components/layout";
import { useContentHomeStore } from "@/store/content-home-store";

export function ContentHomePage() {
  const { viewMode } = useContentHomeStore();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Placeholder for page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">内容主页</h1>
          <p className="text-muted-foreground">
            当前视图: {viewMode === "compact" ? "紧凑模式" : "详细模式"}
          </p>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column - Filters (20%) */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">左栏 - 筛选器</p>
            </div>
          </Column>

          {/* Middle Column - Content List (40%) */}
          <Column size="medium">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">中栏 - 内容列表</p>
            </div>
          </Column>

          {/* Right Column - Trending (20%) */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add route to App component**

**File:** `apps/web/src/App.tsx`

```typescript
import { Route, Routes } from "react-router-dom";

import { ContentHomePage } from "./pages/ContentHomePage";
import { ContentList } from "./components/content/ContentList";
import { EntityList } from "./components/entity/EntityList";
import { AppLayout } from "./components/layout/AppLayout";
import { GridColumn } from "./components/layout/GridColumn";
import { StatsGrid } from "./components/stats/StatsGrid";
import { useRealtime } from "./hooks/useRealtime";
import { TestPage } from "./pages/TestPage";

function Dashboard() {
  useRealtime();

  return (
    <AppLayout>
      <GridColumn size="small">
        <StatsGrid />
      </GridColumn>

      <GridColumn size="medium">
        <ContentList />
      </GridColumn>

      <GridColumn size="small">
        <EntityList />
      </GridColumn>
    </AppLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/content-home" element={<ContentHomePage />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  );
}

export default App;
```

**Step 3: Test the page**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Expected: See page with 3 columns and placeholder text

**Step 4: Stop dev server**

Run: Press `Ctrl+C` in terminal

**Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): create ContentHomePage with 3-column layout structure"
```

---

## Phase 2: Left Column Widgets

### Task 2.1: Install and Setup shadcn/ui Calendar Component

**Files:**
- Create: `apps/web/src/components/ui/calendar.tsx`
- Create: `apps/web/src/components/ui/popover.tsx`
- Modify: `apps/web/package.json`

**Step 1: Install required dependencies**

Run: `cd apps/web && pnpm add react-day-picker @radix-ui/react-popover`

Expected: Dependencies installed

**Step 2: Create Calendar component (shadcn/ui style)**

```typescript
import * as React from "react";
import { Chevron } from "react-day-picker/dist";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start: "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end: "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <Chevron {...props} className="h-4 w-4" />
        ),
        IconRight: ({ ...props }) => (
          <Chevron {...props} className="h-4 w-4" />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
```

**Step 3: Create Popover component**

```typescript
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
```

**Step 4: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/ apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat(web): add Calendar and Popover UI components from shadcn/ui"
```

---

### Task 2.2: Create Calendar Widget

**Files:**
- Create: `apps/web/src/components/widgets/CalendarWidget.tsx`

**Step 1: Write the Calendar widget**

```typescript
import { Calendar } from "@/components/ui/calendar";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

export function CalendarWidget() {
  const { selectedDate, dateRange, setSelectedDate, setDateRange } =
    useContentHomeStore();

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  return (
    <Widget title="日历" icon={<CalendarIcon className="h-4 w-4" />}>
      {/* Single date selection */}
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          className="rounded-md border"
        />

        {/* Show selected date info */}
        <div className="text-sm text-center text-muted-foreground">
          {selectedDate.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </Widget>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

```typescript
export { Widget } from "./Widget";
export type { WidgetProps } from "./Widget";
export { WidgetSkeleton } from "./WidgetSkeleton";
export type { WidgetSkeletonProps } from "./WidgetSkeleton";
export { CalendarWidget } from "./CalendarWidget";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { Column } from "@/components/layout";

export function ContentHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">内容主页</h1>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column */}
          <Column size="small">
            <CalendarWidget />
          </Column>

          {/* Middle Column */}
          <Column size="medium">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">中栏 - 内容列表</p>
            </div>
          </Column>

          {/* Right Column */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Test calendar interaction**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Click on different dates
- Verify selected date updates
- Check persistence on page reload

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add CalendarWidget with date selection"
```

---

### Task 2.3: Create Date Range Picker Widget

**Files:**
- Create: `apps/web/src/components/widgets/DateRangeWidget.tsx

```typescript
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const presetRanges = [
  {
    label: "今天",
    range: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: "昨天",
    range: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "本周",
    range: () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()));
      return { from: firstDay, to: lastDay };
    },
  },
  {
    label: "本月",
    range: () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: firstDay, to: lastDay };
    },
  },
];

export function DateRangeWidget() {
  const { dateRange, setDateRange } = useContentHomeStore();

  return (
    <Widget title="日期范围" icon={<CalendarIcon className="h-4 w-4" />}>
      <div className="space-y-3">
        {/* Preset buttons */}
        <div className="grid grid-cols-2 gap-2">
          {presetRanges.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => setDateRange(preset.range())}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Custom range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "yyyy/MM/dd", { locale: zhCN })} -{" "}
                    {format(dateRange.to, "yyyy/MM/dd", { locale: zhCN })}
                  </>
                ) : (
                  format(dateRange.from, "yyyy/MM/dd", { locale: zhCN })
                )
              ) : (
                <span>选择日期范围</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Show selected range summary */}
        {dateRange?.from && (
          <div className="text-xs text-center text-muted-foreground">
            {dateRange.to
              ? `${Math.ceil(
                  (dateRange.to.getTime() - dateRange.from.getTime()) /
                    (1000 * 60 * 60 * 24),
                )} 天`
              : "1 天"}
          </div>
        )}
      </div>
    </Widget>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add to exports:
```typescript
export { DateRangeWidget } from "./DateRangeWidget";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { Column } from "@/components/layout";

export function ContentHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">内容主页</h1>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column */}
          <Column size="small">
            <CalendarWidget />
            <DateRangeWidget />
          </Column>

          {/* Middle Column */}
          <Column size="medium">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">中栏 - 内容列表</p>
            </div>
          </Column>

          {/* Right Column */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Test date range widget**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Click preset buttons (today, yesterday, etc.)
- Open custom range picker
- Select date range
- Verify range is displayed correctly

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add DateRangeWidget with presets and custom picker"
```

---

### Task 2.4: Create Category Navigation Widget

**Files:**
- Create: `apps/web/src/components/widgets/CategoryNavWidget.tsx`

**Step 1: Write the category nav widget (with mock data)**

```typescript
import { Folder } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface Category {
  name: string;
  count: number;
}

export function CategoryNavWidget() {
  const { filters, setFilters } = useContentHomeStore();

  // Mock data for now - replace with real API later
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      // TODO: Replace with real API call
      // return await api.get("/api/v1/categories/stats");
      return [
        { name: "技术", count: 1250 },
        { name: "产品", count: 856 },
        { name: "行业", count: 432 },
        { name: "设计", count: 287 },
        { name: "创业", count: 195 },
      ];
    },
  });

  const handleCategoryClick = (category: string) => {
    // Toggle category filter
    if (filters.category === category) {
      setFilters({ category: undefined });
    } else {
      setFilters({ category });
    }
  };

  if (isLoading) {
    return (
      <Widget title="分类" icon={<Folder className="h-4 w-4" />}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="分类" icon={<Folder className="h-4 w-4" />}>
      <div className="space-y-1">
        {categories?.map((category) => (
          <button
            key={category.name}
            type="button"
            onClick={() => handleCategoryClick(category.name)}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-md
              hover:bg-accent transition-colors
              ${filters.category === category.name ? "bg-accent" : ""}
            `}
          >
            <span className="text-sm">{category.name}</span>
            <Badge variant="secondary" className="text-xs">
              {category.count}
            </Badge>
          </button>
        ))}
      </div>
    </Widget>
  );
}
```

**Step 2: Create Skeleton UI component**

**File:** `apps/web/src/components/ui/skeleton.tsx`

```typescript
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

**Step 3: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add:
```typescript
export { CategoryNavWidget } from "./CategoryNavWidget";
```

**Step 4: Export Skeleton from UI index**

**File:** `apps/web/src/components/ui/index.ts`

```typescript
export { Skeleton } from "./skeleton";
```

**Step 5: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { Column } from "@/components/layout";

export function ContentHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">内容主页</h1>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column */}
          <Column size="small">
            <CalendarWidget />
            <DateRangeWidget />
            <CategoryNavWidget />
          </Column>

          {/* Middle Column */}
          <Column size="medium">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">中栏 - 内容列表</p>
            </div>
          </Column>

          {/* Right Column */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 6: Test category widget**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Categories are displayed with counts
- Clicking a category highlights it
- Clicking again deselects it
- Check console for any errors

**Step 7: Stop dev server**

Run: Press `Ctrl+C`

**Step 8: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add CategoryNavWidget with mock data"
```

---

### Task 2.5: Create Source Filter Widget

**Files:**
- Create: `apps/web/src/components/widgets/SourceFilterWidget.tsx`

**Step 1: Write the source filter widget (with mock data)**

```typescript
import { Rss, MessageCircle } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface Source {
  id: string;
  name: string;
  type: "rss" | "twitter" | "v2ex";
  enabled: boolean;
}

const sourceTypeIcons = {
  rss: Rss,
  twitter: MessageCircle,
  v2ex: MessageCircle,
};

export function SourceFilterWidget() {
  const { filters, setFilters } = useContentHomeStore();

  // Mock data for now
  const { data: sources, isLoading } = useQuery<Source[]>({
    queryKey: ["sources"],
    queryFn: async () => {
      // TODO: Replace with real API call
      return [
        { id: "1", name: "TechCrunch", type: "rss", enabled: true },
        { id: "2", name: "Hacker News", type: "rss", enabled: true },
        { id: "3", name: "V2EX", type: "v2ex", enabled: true },
        { id: "4", name: "Tech Twitter", type: "twitter", enabled: true },
      ];
    },
  });

  const handleSourceToggle = (sourceId: string) => {
    const current = filters.sourceIds || [];
    const updated = current.includes(sourceId)
      ? current.filter((id) => id !== sourceId)
      : [...current, sourceId];

    setFilters({ sourceIds: updated.length > 0 ? updated : undefined });
  };

  if (isLoading) {
    return (
      <Widget title="数据源">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="数据源">
      <div className="space-y-2">
        {sources?.map((source) => {
          const Icon = sourceTypeIcons[source.type];
          const isChecked = filters.sourceIds?.includes(source.id);

          return (
            <div key={source.id} className="flex items-center space-x-2 px-2 py-1">
              <Checkbox
                id={`source-${source.id}`}
                checked={isChecked}
                onCheckedChange={() => handleSourceToggle(source.id)}
              />
              <Label
                htmlFor={`source-${source.id}`}
                className="flex items-center gap-2 text-sm cursor-pointer flex-1"
              >
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{source.name}</span>
              </Label>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
```

**Step 2: Create Checkbox and Label UI components**

**File:** `apps/web/src/components/ui/checkbox.tsx`

```typescript
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

**File:** `apps/web/src/components/ui/label.tsx`

```typescript
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

**Step 3: Install missing dependencies**

Run: `cd apps/web && pnpm add @radix-ui/react-checkbox @radix-ui/react-label class-variance-authority`

Expected: Dependencies installed

**Step 4: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add:
```typescript
export { SourceFilterWidget } from "./SourceFilterWidget";
```

**Step 5: Export UI components**

**File:** `apps/web/src/components/ui/index.ts`

```typescript
export { Skeleton } from "./skeleton";
export { Checkbox } from "./checkbox";
export { Label } from "./label";
```

**Step 6: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { SourceFilterWidget } from "@/components/widgets/SourceFilterWidget";
import { Column } from "@/components/layout";

export function ContentHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">内容主页</h1>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column */}
          <Column size="small">
            <CalendarWidget />
            <DateRangeWidget />
            <CategoryNavWidget />
            <SourceFilterWidget />
          </Column>

          {/* Middle Column */}
          <Column size="medium">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">中栏 - 内容列表</p>
            </div>
          </Column>

          {/* Right Column */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 7: Test source filter widget**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Sources are displayed with icons
- Checkboxes work correctly
- Multiple sources can be selected

**Step 8: Stop dev server**

Run: Press `Ctrl+C`

**Step 9: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add SourceFilterWidget with checkbox selection"
```

---

### Task 2.6: Create Tag Filter Widget

**Files:**
- Create: `apps/web/src/components/widgets/TagFilterWidget.tsx`

**Step 1: Write the tag filter widget (with mock data)**

```typescript
import { Tag } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Tag {
  name: string;
  count: number;
}

export function TagFilterWidget() {
  const { filters, setFilters } = useContentHomeStore();

  // Mock data for now
  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ["tags", "popular"],
    queryFn: async () => {
      // TODO: Replace with real API call
      return [
        { name: "react", count: 342 },
        { name: "ai", count: 285 },
        { name: "typescript", count: 231 },
        { name: "nextjs", count: 187 },
        { name: "rust", count: 156 },
        { name: "python", count: 142 },
        { name: "machine-learning", count: 128 },
        { name: "web3", count: 95 },
      ];
    },
  });

  const selectedTags = filters.tags || [];

  const handleTagClick = (tagName: string) => {
    const updated = selectedTags.includes(tagName)
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];

    setFilters({ tags: updated.length > 0 ? updated : undefined });
  };

  const handleClearAll = () => {
    setFilters({ tags: undefined });
  };

  if (isLoading) {
    return (
      <Widget title="标签" icon={<Tag className="h-4 w-4" />}>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget
      title="标签"
      icon={<Tag className="h-4 w-4" />}
      actions={
        selectedTags.length > 0 ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            清除
          </button>
        ) : null
      }
    >
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="cursor-pointer"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Popular tags */}
      <div className="flex flex-wrap gap-1">
        {tags?.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);

          return (
            <Badge
              key={tag.name}
              variant={isSelected ? "default" : "outline"}
              className={`
                cursor-pointer transition-colors
                ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
              `}
              onClick={() => handleTagClick(tag.name)}
              title={`${tag.count} 个内容`}
            >
              {tag.name}
            </Badge>
          );
        })}
      </div>
    </Widget>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add:
```typescript
export { TagFilterWidget } from "./TagFilterWidget";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { SourceFilterWidget } from "@/components/widgets/SourceFilterWidget";
import { TagFilterWidget } from "@/components/widgets/TagFilterWidget";
import { Column } from "@/components/layout";

export function ContentHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">内容主页</h1>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column - Filters */}
          <Column size="small">
            <CalendarWidget />
            <DateRangeWidget />
            <CategoryNavWidget />
            <SourceFilterWidget />
            <TagFilterWidget />
          </Column>

          {/* Middle Column */}
          <Column size="medium">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">中栏 - 内容列表</p>
            </div>
          </Column>

          {/* Right Column */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Test tag filter widget**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Tags are displayed as badges
- Click tags to select/deselect
- Selected tags shown at top
- Clear button removes all selections

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add TagFilterWidget with tag selection and clear all"
```

---

## Phase 3: Middle Column - Content List

### Task 3.1: Create Content List API Integration

**Files:**
- Create: `apps/web/src/lib/api/contents.ts`

**Step 1: Write the contents API functions**

```typescript
import { api, queryKeys } from "@/lib/api";
import type {
  Content,
  PaginationParams,
  PaginatedResponse,
} from "@intellipick/shared";

interface ContentQueryParams extends PaginationParams {
  date?: string;
  from?: string;
  to?: string;
  category?: string;
  tags?: string[];
  sourceIds?: string[];
}

export const contentsApi = {
  /**
   * Fetch contents with filters
   */
  async getContents(params: ContentQueryParams): Promise<PaginatedResponse<Content>> {
    const queryParams: Record<string, string> = {};

    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.date) queryParams.date = params.date;
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;
    if (params.category) queryParams.category = params.category;
    if (params.tags?.length) queryParams.tags = params.join(",");
    if (params.sourceIds?.length) queryParams.sourceId = params.sourceIds.join(",");

    return api.get<PaginatedResponse<Content>>("/api/v1/contents", {
      params: queryParams,
    });
  },

  /**
   * Fetch single content by ID
   */
  async getContentById(id: string): Promise<Content> {
    return api.get<Content>(`/api/v1/contents/${id}`);
  },

  /**
   * Query key factory for contents
   */
  queryKeys: {
    all: ["contents"] as const,
    filtered: (params: ContentQueryParams) =>
      ["contents", "filtered", params] as const,
    detail: (id: string) => ["contents", "detail", id] as const,
  },
};
```

**Step 2: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/src/lib/api/
git commit -m "feat(web): add contents API integration functions"
```

---

### Task 3.2: Create Content List Component with React Query

**Files:**
- Create: `apps/web/src/components/content/ContentListNew.tsx`

**Step 1: Write the content list component**

```typescript
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ExternalLink, Loader2 } from "lucide-react";
import { useContentHomeStore } from "@/store/content-home-store";
import { contentsApi } from "@/lib/api/contents";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  author?: string;
  publishedAt: string;
  category?: string;
  tags?: string[];
  source?: {
    name: string;
    type: string;
  };
  filterResult?: {
    score: number;
  };
}

interface ContentListProps {
  className?: string;
}

export function ContentListNew({ className }: ContentListProps) {
  const { selectedDate, dateRange, filters, viewMode } = useContentHomeStore();

  // Build query params from store
  const queryParams = {
    date: dateRange.from ? undefined : selectedDate.toISOString().split("T")[0],
    from: dateRange.from?.toISOString().split("T")[0],
    to: dateRange.to?.toISOString().split("T")[0],
    category: filters.category,
    tags: filters.tags,
    sourceIds: filters.sourceIds,
    page: 1,
    limit: 20,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: contentsApi.queryKeys.filtered(queryParams),
    queryFn: () => contentsApi.getContents(queryParams),
  });

  if (isLoading) {
    return (
      <div className={cn("flex justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-destructive mb-2">加载失败</p>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as Error).message}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-primary hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">没有找到内容</p>
        <p className="text-sm text-muted-foreground mt-2">
          试试调整筛选条件或选择其他日期
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Show filter summary */}
      {(filters.category || filters.tags?.length || filters.sourceIds?.length) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
          <span>筛选:</span>
          {filters.category && <span className="badge">{filters.category}</span>}
          {filters.sourceIds?.length && (
            <span className="badge">{filters.sourceIds.length} 个数据源</span>
          )}
          {filters.tags?.length && (
            <span className="badge">{filters.tags.length} 个标签</span>
          )}
        </div>
      )}

      {/* Content items */}
      {items.map((item) => (
        <ContentListItem key={item.id} item={item} viewMode={viewMode} />
      ))}

      {/* Pagination placeholder */}
      {data && data.total > items.length && (
        <div className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            显示 {items.length} / {data.total} 条
          </p>
        </div>
      )}
    </div>
  );
}

interface ContentListItemProps {
  item: ContentItem;
  viewMode: "compact" | "detailed";
}

function ContentListItem({ item, viewMode }: ContentListItemProps) {
  if (viewMode === "detailed") {
    return <ContentDetailedCard item={item} />;
  }

  return <ContentCompactCard item={item} />;
}

function ContentCompactCard({ item }: { item: ContentItem }) {
  return (
    <div className="group p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
      {/* Title with link */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1"
        >
          {item.title}
        </a>
        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {/* Summary */}
      {item.summary && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {item.summary}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {item.source && (
          <span className="font-medium">{item.source.name}</span>
        )}
        {item.category && (
          <>
            <span>·</span>
            <span>{item.category}</span>
          </>
        )}
        {item.publishedAt && (
          <>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(item.publishedAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-muted rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentDetailedCard({ item }: { item: ContentItem }) {
  return (
    <div className="group p-5 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
      {/* Title with link */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors flex-1"
        >
          {item.title}
        </a>
        <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {/* Summary */}
      {item.summary && (
        <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>
      )}

      {/* Key points - if available */}
      {/* TODO: Add when API returns keyPoints */}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
        {item.source && (
          <span className="font-medium">{item.source.name}</span>
        )}
        {item.author && <span>by {item.author}</span>}
        {item.category && <span>· {item.category}</span>}
        {item.publishedAt && (
          <span>
            · {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: zhCN })}
          </span>
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-muted rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Score - if available */}
      {item.filterResult?.score && (
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          AI 评分: {Math.round(item.filterResult.score * 100)}%
        </div>
      )}
    </div>
  );
}
```

**Step 2: Export from content components**

**File:** `apps/web/src/components/content/index.ts`

```typescript
export { ContentListNew } from "./ContentListNew";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { SourceFilterWidget } from "@/components/widgets/SourceFilterWidget";
import { TagFilterWidget } from "@/components/widgets/TagFilterWidget";
import { ContentListNew } from "@/components/content/ContentListNew";
import { Column } from "@/components/layout";
import { List, Grid3x3 } from "lucide-react";
import { useContentHomeStore } from "@/store/content-home-store";
import { Button } from "@/components/ui/button";

export function ContentHomePage() {
  const { viewMode, setViewMode } = useContentHomeStore();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">内容主页</h1>
            <p className="text-sm text-muted-foreground mt-1">
              浏览和发现有价值的内容
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("compact")}
            >
              <List className="h-4 w-4" />
              紧凑
            </Button>
            <Button
              variant={viewMode === "detailed" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("detailed")}
            >
              <Grid3x3 className="h-4 w-4" />
              详细
            </Button>
          </div>
        </div>

        {/* 3-column widget layout */}
        <div className="flex gap-5">
          {/* Left Column - Filters */}
          <Column size="small">
            <CalendarWidget />
            <DateRangeWidget />
            <CategoryNavWidget />
            <SourceFilterWidget />
            <TagFilterWidget />
          </Column>

          {/* Middle Column - Content List */}
          <Column size="medium">
            <ContentListNew />
          </Column>

          {/* Right Column */}
          <Column size="small">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">右栏 - 热门</p>
            </div>
          </Column>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Test content list**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Content list displays
- Compact/Detailed view toggle works
- Click external links
- Check browser console for API errors
- Try changing filters (should refetch data)

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add ContentList with compact/detailed view modes"
```

---

## Phase 4: Right Column Widgets

### Task 4.1: Create Trending Entities Widget

**Files:**
- Create: `apps/web/src/components/widgets/TrendingEntitiesWidget.tsx`

**Step 1: Write the trending entities widget**

```typescript
import { TrendingUp, Building2, User, Package, Wrench } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Entity {
  id: string;
  name: string;
  type: "company" | "person" | "product" | "technology";
  mentionCount: number;
  lastMentionedAt: string;
}

const entityTypeIcons = {
  company: Building2,
  person: User,
  product: Package,
  technology: Wrench,
};

const entityTypeLabels = {
  company: "公司",
  person: "人物",
  product: "产品",
  technology: "技术",
};

export function TrendingEntitiesWidget() {
  const { selectedDate } = useContentHomeStore();

  // Mock data for now
  const { data: entities, isLoading } = useQuery<Entity[]>({
    queryKey: ["trending-entities", selectedDate],
    queryFn: async () => {
      // TODO: Replace with real API call
      return [
        {
          id: "1",
          name: "OpenAI",
          type: "company",
          mentionCount: 142,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "React",
          type: "technology",
          mentionCount: 98,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "ChatGPT",
          type: "product",
          mentionCount: 87,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Elon Musk",
          type: "person",
          mentionCount: 65,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "5",
          name: "TypeScript",
          type: "technology",
          mentionCount: 54,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "6",
          name: "Tesla",
          type: "company",
          mentionCount: 48,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "7",
          name: "Vercel",
          type: "company",
          mentionCount: 42,
          lastMentionedAt: new Date().toISOString(),
        },
        {
          id: "8",
          name: "Next.js",
          type: "technology",
          mentionCount: 38,
          lastMentionedAt: new Date().toISOString(),
        },
      ];
    },
  });

  if (isLoading) {
    return (
      <Widget
        title="热门实体"
        icon={<TrendingUp className="h-4 w-4" />}
      >
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget
      title="热门实体"
      icon={<TrendingUp className="h-4 w-4" />}
    >
      <div className="space-y-1">
        {entities?.slice(0, 10).map((entity, index) => {
          const Icon = entityTypeIcons[entity.type];

          return (
            <div
              key={entity.id}
              className="flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
            >
              {/* Rank */}
              <span className="text-xs font-bold text-muted-foreground w-4">
                {index + 1}
              </span>

              {/* Icon */}
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />

              {/* Name and type */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{entity.name}</div>
                <div className="text-xs text-muted-foreground">
                  {entityTypeLabels[entity.type]}
                </div>
              </div>

              {/* Mention count */}
              <Badge variant="secondary" className="text-xs">
                {entity.mentionCount}
              </Badge>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add:
```typescript
export { TrendingEntitiesWidget } from "./TrendingEntitiesWidget";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { TrendingEntitiesWidget } from "@/components/widgets/TrendingEntitiesWidget";

// In the right column:
<Column size="small">
  <TrendingEntitiesWidget />
  <div className="p-4 border rounded-lg bg-muted/50">
    <p className="text-sm text-muted-foreground">更多...</p>
  </div>
</Column>
```

**Step 4: Test trending entities**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Entities are displayed with icons
- Hover effects work
- Badge shows mention count

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add TrendingEntitiesWidget with top 10 entities"
```

---

### Task 4.2: Create Latest Contents Widget

**Files:**
- Create: `apps/web/src/components/widgets/LatestContentsWidget.tsx`

**Step 1: Write the latest contents widget**

```typescript
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Widget } from "@/components/widgets/Widget";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface LatestContent {
  id: string;
  title: string;
  publishedAt: string;
}

export function LatestContentsWidget() {
  // Mock data - reuse content list query but limit to latest 5
  const { data: contents, isLoading } = useQuery<LatestContent[]>({
    queryKey: ["contents", "latest", 5],
    queryFn: async () => {
      // TODO: Replace with real API call
      return [
        {
          id: "1",
          title: "React 19 正式发布，带来了哪些新特性？",
          publishedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
        },
        {
          id: "2",
          title: "TypeScript 5.4 带来更强大的类型推断",
          publishedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
        },
        {
          id: "3",
          title: "OpenAI 发布 GPT-5 预览版",
          publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        },
        {
          id: "4",
          title: "Vite 6.0 性能提升显著",
          publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
        },
        {
          id: "5",
          title: "Next.js 15 App Router 最佳实践",
          publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        },
      ];
    },
  });

  if (isLoading) {
    return (
      <Widget title="最新内容" icon={<Clock className="h-4 w-4" />}>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="最新内容" icon={<Clock className="h-4 w-4" />}>
      <div className="space-y-3">
        {contents?.map((content) => (
          <div
            key={content.id}
            className="group cursor-pointer"
          >
            <div className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {content.title}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(content.publishedAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add:
```typescript
export { LatestContentsWidget } from "./LatestContentsWidget";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { LatestContentsWidget } from "@/components/widgets/LatestContentsWidget";

// In the right column:
<Column size="small">
  <TrendingEntitiesWidget />
  <LatestContentsWidget />
</Column>
```

**Step 4: Test latest contents**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Latest contents displayed
- Time ago format shows correctly
- Hover effect on title

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add LatestContentsWidget showing recent updates"
```

---

### Task 4.3: Create Popular Tags Widget

**Files:**
- Create: `apps/web/src/components/widgets/PopularTagsWidget.tsx`

**Step 1: Write the popular tags widget (cloud visualization)**

```typescript
import { Tag } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Tag {
  name: string;
  count: number;
}

export function PopularTagsWidget() {
  // Mock data
  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ["tags", "popular", 20],
    queryFn: async () => {
      return [
        { name: "react", count: 342 },
        { name: "ai", count: 285 },
        { name: "typescript", count: 231 },
        { name: "nextjs", count: 187 },
        { name: "rust", count: 156 },
        { name: "python", count: 142 },
        { name: "machine-learning", count: 128 },
        { name: "web3", count: 95 },
        { name: "tailwind", count: 87 },
        { name: "graphql", count: 76 },
        { name: "docker", count: 65 },
        { name: "kubernetes", count: 54 },
        { name: "linux", count: 48 },
        { name: "database", count: 42 },
        { name: "security", count: 38 },
      ];
    },
  });

  if (isLoading) {
    return (
      <Widget title="热门标签" icon={<Tag className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
      </Widget>
    );
  }

  // Calculate tag sizes based on count
  const maxCount = Math.max(...(tags?.map((t) => t.count) || [1]));
  const getTagSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return "text-base px-3 py-1.5";
    if (ratio > 0.5) return "text-sm px-2.5 py-1";
    return "text-xs px-2 py-0.5";
  };

  const getTagColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return "bg-primary text-primary-foreground";
    if (ratio > 0.5) return "bg-secondary text-secondary-foreground";
    return "bg-muted text-muted-foreground hover:bg-accent";
  };

  return (
    <Widget title="热门标签" icon={<Tag className="h-4 w-4" />}>
      <div className="flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <span
            key={tag.name}
            className={cn(
              "rounded-md cursor-pointer transition-colors",
              getTagSize(tag.count),
              getTagColor(tag.count)
            )}
            title={`${tag.count} 个内容`}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </Widget>
  );
}
```

**Step 2: Export from widget index**

**File:** `apps/web/src/components/widgets/index.ts`

Add:
```typescript
export { PopularTagsWidget } from "./PopularTagsWidget";
```

**Step 3: Add to ContentHomePage**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { PopularTagsWidget } from "@/components/widgets/PopularTagsWidget";

// In the right column:
<Column size="small">
  <TrendingEntitiesWidget />
  <LatestContentsWidget />
  <PopularTagsWidget />
</Column>
```

**Step 4: Test popular tags**

Run: `cd apps/web && pnpm dev`

Visit: `http://localhost:5173/content-home`

Test:
- Tags displayed in cloud layout
- Sizes reflect popularity
- Colors indicate importance
- Hover effects work

**Step 5: Stop dev server**

Run: Press `Ctrl+C`

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add PopularTagsWidget with cloud visualization"
```

---

## Phase 5: Integration & Polish

### Task 5.1: Update Main Navigation

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Update App component to use ContentHomePage as default**

```typescript
import { Route, Routes } from "react-router-dom";

import { ContentHomePage } from "./pages/ContentHomePage";
import { ContentList } from "./components/content/ContentList";
import { EntityList } from "./components/entity/EntityList";
import { AppLayout } from "./components/layout/AppLayout";
import { GridColumn } from "./components/layout/GridColumn";
import { StatsGrid } from "./components/stats/StatsGrid";
import { useRealtime } from "./hooks/useRealtime";
import { TestPage } from "./pages/TestPage";

function Dashboard() {
  useRealtime();

  return (
    <AppLayout>
      <GridColumn size="small">
        <StatsGrid />
      </GridColumn>

      <GridColumn size="medium">
        <ContentList />
      </GridColumn>

      <GridColumn size="small">
        <EntityList />
      </GridColumn>
    </AppLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ContentHomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  );
}

export default App;
```

**Step 2: Test navigation**

Run: `cd apps/web && pnpm dev`

Visit:
- `http://localhost:5173/` - Should show ContentHomePage
- `http://localhost:5173/dashboard` - Should show old dashboard
- `http://localhost:5173/test` - Should show test page

**Step 3: Stop dev server**

Run: Press `Ctrl+C`

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): set ContentHomePage as default route"
```

---

### Task 5.2: Add Responsive Design

**Files:**
- Modify: `apps/web/src/pages/ContentHomePage.tsx`

**Step 1: Update page with responsive classes**

```typescript
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { SourceFilterWidget } from "@/components/widgets/SourceFilterWidget";
import { TagFilterWidget } from "@/components/widgets/TagFilterWidget";
import { TrendingEntitiesWidget } from "@/components/widgets/TrendingEntitiesWidget";
import { LatestContentsWidget } from "@/components/widgets/LatestContentsWidget";
import { PopularTagsWidget } from "@/components/widgets/PopularTagsWidget";
import { ContentListNew } from "@/components/content/ContentListNew";
import { Column } from "@/components/layout";
import { List, Grid3x3 } from "lucide-react";
import { useContentHomeStore } from "@/store/content-home-store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function ContentHomePage() {
  const { viewMode, setViewMode } = useContentHomeStore();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">内容主页</h1>
              <p className="text-sm text-muted-foreground mt-1">
                浏览和发现有价值的内容
              </p>
            </div>

            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              {showMobileFilters ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              筛选
            </Button>

            {/* View mode toggle */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={viewMode === "compact" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("compact")}
              >
                <List className="h-4 w-4" />
                紧凑
              </Button>
              <Button
                variant={viewMode === "detailed" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("detailed")}
              >
                <Grid3x3 className="h-4 w-4" />
                详细
              </Button>
            </div>
          </div>

          {/* Mobile view mode toggle */}
          <div className="flex md:hidden gap-2 mb-4">
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="flex-1"
            >
              <List className="h-4 w-4 mr-2" />
              紧凑
            </Button>
            <Button
              variant={viewMode === "detailed" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("detailed")}
              className="flex-1"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              详细
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {/* Desktop: 3-column layout */}
        <div className="hidden lg:flex gap-5">
          {/* Left Column - Filters (20%) */}
          <Column size="small">
            <CalendarWidget />
            <DateRangeWidget />
            <CategoryNavWidget />
            <SourceFilterWidget />
            <TagFilterWidget />
          </Column>

          {/* Middle Column - Content List (40%) */}
          <Column size="medium">
            <ContentListNew />
          </Column>

          {/* Right Column - Trending (20%) */}
          <Column size="small">
            <TrendingEntitiesWidget />
            <LatestContentsWidget />
            <PopularTagsWidget />
          </Column>
        </div>

        {/* Tablet: 2-column layout */}
        <div className="hidden md:flex lg:hidden gap-5">
          {/* Left Column - Filters + Right widgets (30%) */}
          <div className="w-[30%] flex flex-col gap-5">
            <CalendarWidget />
            <DateRangeWidget />
            <CategoryNavWidget />
            <SourceFilterWidget />
            <TagFilterWidget />
          </div>

          {/* Right Column - Content (70%) */}
          <div className="w-[70%]">
            <ContentListNew />
          </div>
        </div>

        {/* Mobile: Single column with collapsible filters */}
        <div className="md:hidden">
          {/* Mobile filters panel */}
          {showMobileFilters && (
            <div className="mb-4 space-y-4">
              <CalendarWidget />
              <DateRangeWidget />
              <CategoryNavWidget />
              <SourceFilterWidget />
              <TagFilterWidget />
            </div>
          )}

          {/* Content list */}
          <ContentListNew />

          {/* Trending widgets below content on mobile */}
          <div className="mt-6 space-y-5">
            <TrendingEntitiesWidget />
            <LatestContentsWidget />
            <PopularTagsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Test responsive design**

Run: `cd apps/web && pnpm dev`

Test at different viewport sizes:
- Desktop (>1280px): 3 columns
- Tablet (768-1280px): 2 columns
- Mobile (<768px): 1 column with collapsible filters

**Step 3: Stop dev server**

Run: Press `Ctrl+C`

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add responsive design for mobile and tablet"
```

---

### Task 5.3: Add Error Boundaries

**Files:**
- Create: `apps/web/src/components/ErrorBoundary.tsx`

**Step 1: Create ErrorBoundary component**

```typescript
import type { ReactNode } from "react";
import { Component } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">出错了</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "未知错误"}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Wrap ContentHomePage with ErrorBoundary**

**File:** `apps/web/src/pages/ContentHomePage.tsx`

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap the return
export function ContentHomePage() {
  return (
    <ErrorBoundary>
      {/* existing content */}
    </ErrorBoundary>
  );
}
```

**Step 3: Run type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add ErrorBoundary for graceful error handling"
```

---

### Task 5.4: Final Integration and Testing

**Step 1: Full application test**

Run: `cd apps/web && pnpm dev`

Test checklist:
- [ ] Page loads without errors
- [ ] All widgets display correctly
- [ ] Date selection works
- [ ] Filters work and update content list
- [ ] View mode toggle works
- [ ] Responsive design works at different sizes
- [ ] Browser console has no errors
- [ ] Mock data displays correctly
- [ ] Persisted state works on page reload

**Step 2: Build test**

Run: `cd apps/web && pnpm build`

Expected: Build succeeds without errors

**Step 3: Type check**

Run: `cd apps/web && pnpm typecheck`

Expected: No type errors

**Step 4: Lint check**

Run: `cd apps/web && pnpm lint`

Expected: No lint errors (or only auto-fixable ones)

**Step 5: Final commit**

```bash
git add apps/web/src/
git commit -m "feat(web): complete Page 1 Content Homepage implementation

- 3-column widget layout with filters and content list
- Calendar and date range selection
- Category, source, and tag filters
- Compact and detailed view modes
- Trending entities, latest contents, and popular tags widgets
- Responsive design for mobile, tablet, and desktop
- Error boundaries for graceful error handling
- Mock data integration (ready for real API)

All Phase 1-5 tasks completed."
```

---

## Summary

This implementation plan covers:

### ✅ Phase 1: Foundation & Widget System
- Dependencies installation
- Content home page store (Zustand)
- Reusable Widget container component
- Widget skeleton loading
- Column layout component
- Content home page structure

### ✅ Phase 2: Left Column Widgets
- Calendar widget (shadcn/ui)
- Date range picker widget
- Category navigation widget
- Source filter widget
- Tag filter widget

### ✅ Phase 3: Middle Column - Content List
- Contents API integration
- Content list with React Query
- Compact and detailed view modes
- Loading, error, and empty states
- View mode toggle

### ✅ Phase 4: Right Column Widgets
- Trending entities widget
- Latest contents widget
- Popular tags widget (cloud visualization)

### ✅ Phase 5: Integration & Polish
- Navigation updates
- Responsive design (mobile/tablet/desktop)
- Error boundaries
- Final testing and validation

### Next Steps (Future Phases)

The following features are planned for future implementation:

- **Phase 6**: Real-time updates with Socket.IO
- **Phase 7**: Replace mock data with real API calls
- **Phase 8**: Add pagination to content list
- **Phase 9**: Performance optimization (virtual scrolling)
- **Phase 10**: Unit and integration tests

### API Dependencies

The following API endpoints need to be implemented by the backend team (see `docs/plans/2026-01-09-api-requirements.md`):

- `GET /api/v1/contents/dates` - Content dates for calendar
- `GET /api/v1/categories/stats` - Category statistics
- `GET /api/v1/tags/popular` - Popular tags
- `GET /api/v1/entities/trending?date=` - Trending entities by date
- WebSocket `content:created` event - Real-time updates

Current implementation uses mock data and is ready for API integration.

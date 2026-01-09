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

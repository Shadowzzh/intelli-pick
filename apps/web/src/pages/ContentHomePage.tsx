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
            <TrendingEntitiesWidget />
            <LatestContentsWidget />
            <PopularTagsWidget />
          </Column>
        </div>
      </div>
    </div>
  );
}

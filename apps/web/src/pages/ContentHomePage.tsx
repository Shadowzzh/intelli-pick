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

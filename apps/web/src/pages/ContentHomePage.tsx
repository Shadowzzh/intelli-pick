import { ContentListNew } from "@/components/content/ContentListNew";
import { Column } from "@/components/layout";
import { Button } from "@/components/ui/button";
// import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { LatestContentsWidget } from "@/components/widgets/LatestContentsWidget";
import { PopularTagsWidget } from "@/components/widgets/PopularTagsWidget";
import { SourceFilterWidget } from "@/components/widgets/SourceFilterWidget";
import { TagFilterWidget } from "@/components/widgets/TagFilterWidget";
import { TrendingEntitiesWidget } from "@/components/widgets/TrendingEntitiesWidget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Grid3x3, List } from "lucide-react";

export function ContentHomePage() {
	const { viewMode, setViewMode } = useContentHomeStore();

	return (
		<div className="min-h-screen bg-background text-foreground p-4 md:p-6">
			<div className="w-full">
				{/* Page header */}
				<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
							<span className="hidden sm:inline">紧凑</span>
						</Button>
						<Button
							variant={viewMode === "detailed" ? "default" : "outline"}
							size="sm"
							onClick={() => setViewMode("detailed")}
						>
							<Grid3x3 className="h-4 w-4" />
							<span className="hidden sm:inline">详细</span>
						</Button>
					</div>
				</div>

				{/* 3-column widget layout - responsive */}
				<div className="flex flex-col lg:flex-row gap-5">
					{/* Left Column - Filters */}
					<Column size="small">
						{/* <CalendarWidget /> */}
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

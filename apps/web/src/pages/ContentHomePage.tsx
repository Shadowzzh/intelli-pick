import { ContentListNew } from "@/components/content/ContentListNew";
import { Column } from "@/components/layout";
import { PageHeader } from "@/components/layout/PageHeader";
// import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { CategoryNavWidget } from "@/components/widgets/CategoryNavWidget";
import { DateRangeWidget } from "@/components/widgets/DateRangeWidget";
import { LatestContentsWidget } from "@/components/widgets/LatestContentsWidget";
import { PopularTagsWidget } from "@/components/widgets/PopularTagsWidget";
import { SourceFilterWidget } from "@/components/widgets/SourceFilterWidget";
import { TagFilterWidget } from "@/components/widgets/TagFilterWidget";
import { TrendingEntitiesWidget } from "@/components/widgets/TrendingEntitiesWidget";
import { useContentHomeStore } from "@/store/content-home-store";

export function ContentHomePage() {
	const { currentPage, setCurrentPage } = useContentHomeStore();

	return (
		<div className="min-h-screen bg-background text-foreground p-4 md:p-6">
			<div className="w-full">
				{/* Page header */}
				<PageHeader
					pages={[1, 2, 3, 4]}
					currentPage={currentPage}
					onPageChange={setCurrentPage}
				/>

				{/* 3-column widget layout - responsive */}
				<div className="flex flex-col lg:flex-row gap-5">
					{/* Left Column - Filters */}
					<Column size="small">
						{/* <CalendarWidget /> */}
						<DateRangeWidget />
						<CategoryNavWidget contentClassName="max-h-96 overflow-auto" />
						<TagFilterWidget />
					</Column>

					{/* Middle Column - Content List */}
					<Column size="medium" className="lg:h-[calc(100vh-7.5rem)] h-auto">
						<ContentListNew />
					</Column>

					{/* Right Column */}
					<Column size="small">
						<LatestContentsWidget />
						<PopularTagsWidget />
					</Column>

					<Column size="small">
						<SourceFilterWidget />
						<TrendingEntitiesWidget />
					</Column>
				</div>
			</div>
		</div>
	);
}

import { Button } from "@/components/ui/button";
import { Widget } from "@/components/widgets/Widget";
import type { DateRange } from "@/lib/date-utils";
import { DATE_RANGE_PRESETS } from "@/lib/date-utils";
import { useContentHomeStore } from "@/store/content-home-store";
import { Calendar as CalendarIcon } from "lucide-react";

/**
 * 检查两个日期范围是否相等
 */
function isDateRangeEqual(range1: DateRange, range2: DateRange): boolean {
	if (!range1.from && !range2.from && !range1.to && !range2.to) {
		return true;
	}

	if (!range1.from || !range2.from) return false;
	if (!range1.to || !range2.to) return false;

	const from1 = range1.from.getTime();
	const from2 = range2.from.getTime();
	const to1 = range1.to.getTime();
	const to2 = range2.to.getTime();

	return from1 === from2 && to1 === to2;
}

/**
 * 日期范围小组件
 * @returns
 */
export function DateRangeWidget() {
	const { dateRange, setDateRange } = useContentHomeStore();

	return (
		<Widget title="日期范围" icon={<CalendarIcon className="h-4 w-4" />}>
			<div className="space-y-3">
				{/* Preset buttons */}
				<div className="grid grid-cols-2 gap-2">
					{DATE_RANGE_PRESETS.map((preset) => {
						const presetRange = preset.range();
						const isSelected = isDateRangeEqual(dateRange, presetRange);

						return (
							<Button
								key={preset.label}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								onClick={() => setDateRange(presetRange)}
								className="text-xs border-secondary shadow-none"
							>
								{preset.label}
							</Button>
						);
					})}
				</div>
			</div>
		</Widget>
	);
}

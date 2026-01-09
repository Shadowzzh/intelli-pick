import { Button } from "@/components/ui/button";
import { Widget } from "@/components/widgets/Widget";
import { DATE_RANGE_PRESETS } from "@/lib/date-utils";
import { useContentHomeStore } from "@/store/content-home-store";
import { Calendar as CalendarIcon } from "lucide-react";

/**
 * 日期范围小组件
 * @returns
 */
export function DateRangeWidget() {
	const { setDateRange } = useContentHomeStore();

	return (
		<Widget title="日期范围" icon={<CalendarIcon className="h-4 w-4" />}>
			<div className="space-y-3">
				{/* Preset buttons */}
				<div className="grid grid-cols-2 gap-2">
					{DATE_RANGE_PRESETS.map((preset) => (
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
			</div>
		</Widget>
	);
}

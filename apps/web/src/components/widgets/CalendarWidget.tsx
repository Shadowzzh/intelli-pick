import { Calendar } from "@/components/ui/calendar";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { CalendarIcon } from "lucide-react";

export function CalendarWidget() {
	const { selectedDate, setSelectedDate } = useContentHomeStore();

	const handleSelect = (date: Date | undefined) => {
		if (date) {
			setSelectedDate(date);
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

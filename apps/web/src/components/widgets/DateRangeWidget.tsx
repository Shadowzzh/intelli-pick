import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
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
              onSelect={(range) => {
                if (range) {
                  setDateRange({
                    from: range.from,
                    to: range.to, // Convert optional to undefined
                  });
                }
              }}
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

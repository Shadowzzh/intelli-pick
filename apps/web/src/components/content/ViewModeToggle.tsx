import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContentHomeStore } from "@/store/content-home-store";
import { LayoutList, List } from "lucide-react";

export function ViewModeToggle() {
	const { viewMode, setViewMode } = useContentHomeStore();

	return (
		<div className="flex items-center gap-1">
			<Button
				variant={viewMode === "compact" ? "default" : "ghost"}
				size="icon-sm"
				onClick={() => setViewMode("compact")}
				className={cn(
					"size-8",
					viewMode === "compact"
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground",
				)}
				title="简略视图"
			>
				<List className="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === "detailed" ? "default" : "ghost"}
				size="icon-sm"
				onClick={() => setViewMode("detailed")}
				className={cn(
					"size-8",
					viewMode === "detailed"
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground",
				)}
				title="详细视图"
			>
				<LayoutList className="h-4 w-4" />
			</Button>
		</div>
	);
}

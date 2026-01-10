import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface SearchBoxProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function SearchBox({
	value,
	onChange,
	placeholder = "搜索标题或摘要...",
	className,
}: SearchBoxProps) {
	return (
		<div className={cn("relative", className)}>
			<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn(
					"h-8 w-48 pl-8 pr-2 text-sm border rounded-md",
					"focus:ring-2 focus:ring-primary focus:outline-none",
					"placeholder:text-muted-foreground",
					"transition-all",
				)}
			/>
		</div>
	);
}

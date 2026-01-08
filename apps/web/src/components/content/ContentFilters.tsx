import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface Filters {
	sources: string[];
	categories: string[];
	minScore?: number;
}

interface ContentFiltersProps {
	filters: Filters;
	onFiltersChange: (filters: Partial<Filters>) => void;
}

export function ContentFilters({
	filters,
	onFiltersChange,
}: ContentFiltersProps) {
	return (
		<div className="flex gap-2 mb-4">
			<Input
				placeholder="最低评分..."
				type="number"
				value={filters.minScore || ""}
				onChange={(e) =>
					onFiltersChange({
						minScore: e.target.value
							? Number.parseFloat(e.target.value)
							: undefined,
					})
				}
				className="max-w-[120px]"
			/>

			{filters.sources.length > 0 && (
				<div className="flex gap-1">
					{filters.sources.map((source) => (
						<Button key={source} variant="secondary" size="sm">
							{source}
							<X className="ml-1 h-3 w-3" />
						</Button>
					))}
				</div>
			)}
		</div>
	);
}

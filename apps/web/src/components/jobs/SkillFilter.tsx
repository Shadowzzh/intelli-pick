import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { JobFacetItem } from "@/lib/api/jobs";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useState } from "react";

const DEFAULT_SKILL_LIMIT = 50;
const SEARCH_RESULT_LIMIT = 100;

interface SkillFilterProps {
	value: string;
	facets: JobFacetItem[];
	isLoading: boolean;
	onValueChange: (value: string) => void;
}

export function SkillFilter({
	value,
	facets,
	isLoading,
	onValueChange,
}: SkillFilterProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const normalizedSearch = search.trim().toLocaleLowerCase();
	let visibleFacets = facets.slice(0, DEFAULT_SKILL_LIMIT);
	if (normalizedSearch) {
		visibleFacets = facets
			.filter((facet) =>
				facet.name.toLocaleLowerCase().includes(normalizedSearch),
			)
			.slice(0, SEARCH_RESULT_LIMIT);
	}

	const selectValue = (nextValue: string) => {
		onValueChange(nextValue);
		setOpen(false);
		setSearch("");
	};

	return (
		<Popover
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) {
					setSearch("");
				}
			}}
		>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					aria-expanded={open}
					className="w-full justify-between px-3 font-normal md:w-40"
				>
					<span className="truncate">
						{value === "all" ? "全部技术栈" : value}
					</span>
					<ChevronsUpDown className="shrink-0 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[min(22rem,calc(100vw-2rem))] p-2 md:w-72"
			>
				<div className="relative">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="搜索技术栈"
						className="h-8 pl-8"
						autoFocus
					/>
				</div>

				<div className="mt-2 max-h-64 overflow-y-auto">
					<Button
						type="button"
						variant="ghost"
						className="h-8 w-full justify-between px-2 font-normal"
						onClick={() => selectValue("all")}
						aria-pressed={value === "all"}
					>
						<span>全部技术栈</span>
						{value === "all" && <Check />}
					</Button>

					{visibleFacets.map((facet) => (
						<Button
							key={facet.name}
							type="button"
							variant="ghost"
							className="h-8 w-full justify-between px-2 font-normal"
							onClick={() => selectValue(facet.name)}
							aria-pressed={value === facet.name}
							title={facet.name}
						>
							<span className="min-w-0 truncate">
								{facet.name} ({facet.count})
							</span>
							{value === facet.name && <Check className="shrink-0" />}
						</Button>
					))}

					{isLoading && facets.length === 0 && (
						<p className="px-2 py-4 text-center text-sm text-muted-foreground">
							正在加载
						</p>
					)}
					{!isLoading && visibleFacets.length === 0 && (
						<p className="px-2 py-4 text-center text-sm text-muted-foreground">
							没有匹配的技术栈
						</p>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

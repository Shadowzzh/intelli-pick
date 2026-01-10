import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	className,
}: PaginationProps) {
	// 如果总页数为0或1，不显示分页
	if (totalPages <= 1) {
		return null;
	}

	// 计算要显示的页码
	const getPageNumbers = (): (number | string)[] => {
		if (totalPages <= 7) {
			// 总页数 <= 7，显示所有页码
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		// 总页数 > 7，智能省略
		if (currentPage <= 3) {
			// 靠近首页: 1 2 3 4 5 ... 10
			return [1, 2, 3, 4, 5, "...", totalPages];
		}

		if (currentPage >= totalPages - 2) {
			// 靠近末页: 1 ... 6 7 8 9 10
			return [
				1,
				"...",
				totalPages - 4,
				totalPages - 3,
				totalPages - 2,
				totalPages - 1,
				totalPages,
			];
		}

		// 中间位置: 1 ... 4 5 6 ... 10
		return [
			1,
			"...",
			currentPage - 1,
			currentPage,
			currentPage + 1,
			"...",
			totalPages,
		];
	};

	const pageNumbers = getPageNumbers();

	const handlePrevious = () => {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	};

	const handlePageClick = (page: number | string) => {
		if (typeof page === "number") {
			onPageChange(page);
		}
	};

	return (
		<div className={cn("flex items-center gap-1", className)}>
			{/* 上一页按钮 */}
			<button
				type="button"
				onClick={handlePrevious}
				disabled={currentPage === 1}
				className={cn(
					"h-8 px-2 flex items-center justify-center rounded-md transition-colors",
					"hover:bg-muted",
					"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
				)}
				aria-label="上一页"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			{/* 页码按钮 */}
			{pageNumbers.map((page, index) => {
				const isCurrentPage = page === currentPage;
				const isEllipsis = page === "...";

				return (
					<button
						key={`page-${index}`}
						type="button"
						onClick={() => handlePageClick(page)}
						disabled={isEllipsis}
						className={cn(
							"h-8 min-w-[2rem] px-2 flex items-center justify-center rounded-md text-sm transition-colors",
							isCurrentPage && "bg-primary text-primary-foreground",
							!isCurrentPage && !isEllipsis && "hover:bg-muted",
							isEllipsis && "cursor-default",
						)}
					>
						{page}
					</button>
				);
			})}

			{/* 下一页按钮 */}
			<button
				type="button"
				onClick={handleNext}
				disabled={currentPage === totalPages}
				className={cn(
					"h-8 px-2 flex items-center justify-center rounded-md transition-colors",
					"hover:bg-muted",
					"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
				)}
				aria-label="下一页"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</div>
	);
}

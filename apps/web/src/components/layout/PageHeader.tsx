import { ThemeToggle } from "@/components/ThemeToggle";
import { useRefreshAll } from "@/hooks/useRefreshAll";
import { RefreshCw } from "lucide-react";

interface PageHeaderProps {
	pages: number[];
	currentPage: number;
	onPageChange: (page: number) => void;
	themeToggle?: React.ReactNode;
}

export function PageHeader({
	pages,
	currentPage,
	onPageChange,
	themeToggle = <ThemeToggle />,
}: PageHeaderProps) {
	const { isRefreshing, refreshAll } = useRefreshAll();

	return (
		<div className="widget mb-6 px-4 py-2">
			<div className="flex items-center gap-6">
				{/* Logo */}
				<div className="flex items-center gap-2">
					<div className="text-xl font-bold text-primary">I</div>
					<span className="text-base font-bold">IntelliPick</span>
				</div>

				{/* Page 导航 */}
				<div className="flex items-center gap-1">
					{pages.map((page) => (
						<button
							key={page}
							type="button"
							className={`cursor-pointer px-3 py-1 text-sm transition-colors border-b-2 ${
								currentPage === page
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
							}`}
							onClick={() => onPageChange(page)}
						>
							Page {page}
						</button>
					))}
				</div>

				{/* 右侧按钮组 */}
				<div className="ml-auto flex items-center gap-3">
					{/* 刷新按钮 */}
					<button
						type="button"
						onClick={refreshAll}
						disabled={isRefreshing}
						className={`p-2 rounded-md transition-colors cursor-pointer ${
							isRefreshing
								? "text-muted-foreground cursor-not-allowed"
								: "text-muted-foreground hover:text-foreground hover:bg-accent"
						}`}
						title={isRefreshing ? "正在刷新..." : "刷新全部数据"}
					>
						<RefreshCw
							className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
						/>
					</button>

					{/* 主题切换 */}
					{themeToggle}
				</div>
			</div>
		</div>
	);
}

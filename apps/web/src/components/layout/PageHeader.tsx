import { ThemeToggle } from "@/components/ThemeToggle";
import { useRefreshAll } from "@/hooks/useRefreshAll";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface PageHeaderProps {
	pages?: number[];
	currentPage?: number;
	onPageChange?: (page: number) => void;
	themeToggle?: React.ReactNode;
}

const navItems = [
	{ href: "/", label: "内容主页" },
	{ href: "/monitoring", label: "系统监控" },
];

export function PageHeader({ themeToggle = <ThemeToggle /> }: PageHeaderProps) {
	const { isRefreshing, refreshAll } = useRefreshAll();
	const location = useLocation();

	return (
		<div className="widget mb-6 px-4 py-2">
			<div className="flex items-center gap-6">
				{/* Logo */}
				<Link
					to="/"
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					<div className="text-xl font-bold text-primary">I</div>
					<span className="text-base font-bold">IntelliPick</span>
				</Link>

				{/* Navigation */}
				<nav className="flex items-center gap-4">
					{navItems.map((item) => (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								"text-sm font-medium transition-colors hover:text-primary",
								location.pathname === item.href
									? "text-primary"
									: "text-muted-foreground",
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>

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

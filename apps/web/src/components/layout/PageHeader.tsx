import { useAuth } from "@/auth/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useRefreshAll } from "@/hooks/useRefreshAll";
import { cn } from "@/lib/utils";
import { LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface PageHeaderProps {
	pages?: number[];
	currentPage?: number;
	onPageChange?: (page: number) => void;
	themeToggle?: React.ReactNode;
}

const navItems = [
	{ href: "/", label: "内容主页" },
	{ href: "/jobs", label: "工作" },
	{ href: "/monitoring", label: "系统监控" },
];

export function PageHeader({ themeToggle = <ThemeToggle /> }: PageHeaderProps) {
	const { logout } = useAuth();
	const { isRefreshing, refreshAll } = useRefreshAll();
	const location = useLocation();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await logout();
		} catch (error) {
			console.error("退出登录失败", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div className="widget mb-6 px-4 py-2">
			<div className="flex flex-wrap items-center gap-x-6 gap-y-2">
				{/* Logo */}
				<Link
					to="/"
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					<div className="text-xl font-bold text-primary">S</div>
					<span className="text-base font-bold">Sift</span>
				</Link>

				{/* Navigation */}
				<nav className="order-3 flex w-full items-center gap-4 md:order-none md:w-auto">
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

					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="text-muted-foreground hover:text-foreground"
						aria-label="退出登录"
						title="退出登录"
					>
						{isLoggingOut ? (
							<LoaderCircle className="size-4 animate-spin" />
						) : (
							<LogOut className="size-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

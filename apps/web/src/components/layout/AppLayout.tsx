import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface AppLayoutProps {
	children: ReactNode;
}

const navItems = [
	{ href: "/", label: "仪表板" },
	{ href: "/content-home", label: "内容主页" },
	{ href: "/monitoring", label: "系统监控" },
];

export function AppLayout({ children }: AppLayoutProps) {
	const location = useLocation();

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto px-4 py-3">
					<div className="flex items-center justify-between">
						{/* Logo */}
						<Link
							to="/"
							className="text-xl font-bold hover:opacity-80 transition-opacity"
						>
							Sift
						</Link>

						{/* Navigation */}
						<nav className="flex items-center gap-6">
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

						{/* Theme Toggle */}
						<ThemeToggle />
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{children}</div>
			</main>
		</div>
	);
}

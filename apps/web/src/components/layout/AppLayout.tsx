import { ThemeToggle } from "@/components/ThemeToggle";
import type { ReactNode } from "react";

interface AppLayoutProps {
	children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto px-4 py-3 flex items-center justify-between">
					<h1 className="text-xl font-bold">IntelliPick</h1>
					<ThemeToggle />
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{children}</div>
			</main>
		</div>
	);
}

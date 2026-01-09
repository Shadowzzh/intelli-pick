import { ThemeToggle } from "@/components/ThemeToggle";

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
	return (
		<div className="widget mb-6">
			<div className="flex items-center gap-6">
				{/* Logo */}
				<div className="flex items-center gap-2">
					<div className="text-2xl font-bold text-primary">I</div>
					<span className="text-lg font-bold">IntelliPick</span>
				</div>

				{/* Page 导航 */}
				<div className="flex items-center gap-2">
					{pages.map((page) => (
						<button
							key={page}
							type="button"
							className={`px-3 py-1.5 text-sm transition-colors border-b-2 ${
								currentPage === page
									? "border-primary text-foreground font-medium"
									: "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
							}`}
							onClick={() => onPageChange(page)}
						>
							Page {page}
						</button>
					))}
				</div>

				{/* 主题切换 */}
				<div className="ml-auto">{themeToggle}</div>
			</div>
		</div>
	);
}

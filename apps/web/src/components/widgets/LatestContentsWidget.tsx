import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/widgets/Widget";
import { contentsApi } from "@/lib/api/contents";
import type { Content } from "@intellipick/db";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Clock } from "lucide-react";

export function LatestContentsWidget({
	className,
	headerClassName,
	contentClassName,
}: {
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}) {
	const { data, isLoading } = useQuery({
		queryKey: contentsApi.queryKeys.filtered({ limit: 5, page: 1 }),
		queryFn: () => contentsApi.getContents({ limit: 5, page: 1 }),
	});

	const handleClick = (item: Content) => {
		if (item.url) {
			window.open(item.url, "_blank", "noopener,noreferrer");
		}
	};

	if (isLoading) {
		return (
			<Widget
				title="最新内容"
				icon={<Clock className="h-4 w-4" />}
				className={className}
				headerClassName={headerClassName}
				contentClassName={contentClassName}
			>
				<div className="space-y-2">
					{[...Array(5)].map((_, i) => (
						<Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
					))}
				</div>
			</Widget>
		);
	}

	const items = data?.data || [];

	if (items.length === 0) {
		return (
			<Widget
				title="最新内容"
				icon={<Clock className="h-4 w-4" />}
				className={className}
				headerClassName={headerClassName}
				contentClassName={contentClassName}
			>
				<p className="text-sm text-muted-foreground">暂无内容</p>
			</Widget>
		);
	}

	return (
		<Widget
			title="最新内容"
			icon={<Clock className="h-4 w-4" />}
			className={className}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
		>
			<div className="space-y-3">
				{items.map((item: Content) => (
					<div
						key={item.id}
						onClick={() => handleClick(item)}
						onKeyDown={() => handleClick(item)}
						className="group p-3 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
					>
						{/* Title */}
						<div className="flex items-start justify-between gap-2 mb-1">
							{item.title || "无标题"}
						</div>

						{/* Meta info */}
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							{item.publishedAt && (
								<span>
									{formatDistanceToNow(new Date(item.publishedAt), {
										addSuffix: true,
										locale: zhCN,
									})}
								</span>
							)}
							{item.category && (
								<>
									<span>·</span>
									<span>{item.category}</span>
								</>
							)}
						</div>
					</div>
				))}
			</div>
		</Widget>
	);
}

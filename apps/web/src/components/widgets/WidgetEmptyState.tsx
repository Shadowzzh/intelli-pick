import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
	FileTextIcon,
	HashIcon,
	InboxIcon,
	UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type DefaultIconType = "default" | "tags" | "entities" | "contents";

const DEFAULT_EMPTY_ICONS: Record<DefaultIconType, LucideIcon> = {
	default: InboxIcon,
	tags: HashIcon,
	entities: UsersIcon,
	contents: FileTextIcon,
};

export interface WidgetEmptyStateProps {
	className?: string;
	message?: string;
	icon?: ReactNode;
	iconType?: DefaultIconType;
}

export function WidgetEmptyState({
	className,
	message = "暂无数据",
	icon: customIcon,
	iconType = "default",
}: WidgetEmptyStateProps) {
	const DefaultIcon = DEFAULT_EMPTY_ICONS[iconType];
	const iconContent = customIcon || <DefaultIcon className="h-8 w-8" />;

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-8 text-center",
				className,
			)}
		>
			<div className="text-muted-foreground/50 mb-3">{iconContent}</div>
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
}

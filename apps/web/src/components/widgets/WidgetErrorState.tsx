import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export interface WidgetErrorStateProps {
	className?: string;
	error: Error;
	onRetry: () => void;
	message?: string;
	showDetails?: boolean;
}

export function WidgetErrorState({
	className,
	error,
	onRetry,
	message: customMessage,
	showDetails = true,
}: WidgetErrorStateProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const errorMessage = customMessage || "加载失败，请稍后重试";

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-6 text-center",
				className,
			)}
		>
			{/* 错误图标 */}
			<div className="text-destructive mb-3">
				<AlertCircle className="h-8 w-8" />
			</div>

			{/* 错误信息 */}
			<p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>

			{/* 操作按钮 */}
			<Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
				<RefreshCw className="h-3 w-3" />
				重试
			</Button>

			{/* 错误详情（可展开） */}
			{showDetails && (
				<div className="mt-4 w-full">
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
					>
						{isExpanded ? "隐藏" : "查看"}错误详情
					</button>
					{isExpanded && (
						<div className="mt-2 p-2 bg-muted rounded text-xs font-mono text-left overflow-auto max-h-32">
							<div className="font-semibold text-destructive mb-1">
								{error.name}
							</div>
							<div>{error.message}</div>
							{error.stack && (
								<pre className="mt-1 whitespace-pre-wrap opacity-70">
									{error.stack}
								</pre>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

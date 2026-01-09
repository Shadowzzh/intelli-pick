import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ColumnProps {
  children: ReactNode;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Column({ children, size = "medium", className }: ColumnProps) {
  const sizeClasses = {
    small: "w-1/5 min-w-[200px]",
    medium: "w-2/5 min-w-[400px]",
    large: "w-3/5 min-w-[600px]",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

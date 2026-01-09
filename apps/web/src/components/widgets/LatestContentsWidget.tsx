import { Clock } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { contentsApi } from "@/lib/api/contents";
import { useQuery } from "@tanstack/react-query";

export function LatestContentsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: contentsApi.queryKeys.filtered({ limit: 5, page: 1 }),
    queryFn: () => contentsApi.getContents({ limit: 5, page: 1 }),
  });

  if (isLoading) {
    return (
      <Widget title="最新内容" icon={<Clock className="h-4 w-4" />}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  const items = data?.data || [];

  if (items.length === 0) {
    return (
      <Widget title="最新内容" icon={<Clock className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">暂无内容</p>
      </Widget>
    );
  }

  return (
    <Widget title="最新内容" icon={<Clock className="h-4 w-4" />}>
      <div className="space-y-3">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="group p-3 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
          >
            {/* Title */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <a
                href={item.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1"
              >
                {item.title || "无标题"}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
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

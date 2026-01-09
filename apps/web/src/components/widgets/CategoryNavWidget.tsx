import { Folder } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import { useContentHomeStore } from "@/store/content-home-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface Category {
  name: string;
  count: number;
}

export function CategoryNavWidget() {
  const { filters, setFilters } = useContentHomeStore();

  // Mock data for now - replace with real API later
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      // TODO: Replace with real API call
      // return await api.get("/api/v1/categories/stats");
      return [
        { name: "技术", count: 1250 },
        { name: "产品", count: 856 },
        { name: "行业", count: 432 },
        { name: "设计", count: 287 },
        { name: "创业", count: 195 },
      ];
    },
  });

  const handleCategoryClick = (category: string) => {
    // Toggle category filter
    if (filters.category === category) {
      setFilters({ category: undefined });
    } else {
      setFilters({ category });
    }
  };

  if (isLoading) {
    return (
      <Widget title="分类" icon={<Folder className="h-4 w-4" />}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="分类" icon={<Folder className="h-4 w-4" />}>
      <div className="space-y-1">
        {categories?.map((category) => (
          <button
            key={category.name}
            type="button"
            onClick={() => handleCategoryClick(category.name)}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-md
              hover:bg-accent transition-colors
              ${filters.category === category.name ? "bg-accent" : ""}
            `}
          >
            <span className="text-sm">{category.name}</span>
            <Badge variant="secondary" className="text-xs">
              {category.count}
            </Badge>
          </button>
        ))}
      </div>
    </Widget>
  );
}

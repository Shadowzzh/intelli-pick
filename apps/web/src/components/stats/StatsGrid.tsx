import { api, queryKeys } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Database, FileText, Users, Zap } from "lucide-react";
import { StatCard } from "./StatCard";

export function StatsGrid() {
	const { data: stats, isLoading } = useQuery({
		queryKey: queryKeys.stats,
		queryFn: async () => {
			return api.get<{
				totalContents: number;
				totalEntities: number;
				todayNew: number;
				activeSources: number;
			}>("/api/v1/stats");
		},
		refetchInterval: 60000, // Refresh every minute
	});

	if (isLoading) {
		return <div className="text-center py-4">加载中...</div>;
	}

	if (!stats) {
		return <div className="text-center py-4">无法加载统计数据</div>;
	}

	return (
		<div className="grid grid-cols-2 gap-3">
			<StatCard
				title="今日新增"
				value={stats.todayNew}
				icon={<Zap className="h-4 w-4 text-muted-foreground" />}
			/>
			<StatCard
				title="总内容数"
				value={stats.totalContents}
				icon={<FileText className="h-4 w-4 text-muted-foreground" />}
			/>
			<StatCard
				title="实体总数"
				value={stats.totalEntities}
				icon={<Users className="h-4 w-4 text-muted-foreground" />}
			/>
			<StatCard
				title="活跃源"
				value={stats.activeSources}
				icon={<Database className="h-4 w-4 text-muted-foreground" />}
			/>
		</div>
	);
}

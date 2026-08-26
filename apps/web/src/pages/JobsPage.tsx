import { JobNotesDialog } from "@/components/jobs/JobNotesDialog";
import { SkillFilter } from "@/components/jobs/SkillFilter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	WidgetEmptyState,
	WidgetErrorState,
	WidgetLoadingState,
} from "@/components/widgets";
import {
	type JobPostingItem,
	type JobRemoteType,
	type JobTrackingPatch,
	type JobTrackingStatus,
	jobsApi,
} from "@/lib/api/jobs";
import { JOB_ROLE_CATEGORIES, type JobRoleCategory } from "@intellipick/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	Banknote,
	Bookmark,
	BriefcaseBusiness,
	Building2,
	CircleOff,
	Clock3,
	ExternalLink,
	MapPin,
	RotateCcw,
	Search,
	StickyNote,
} from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

const TRACKING_LABELS: Record<JobTrackingStatus, string> = {
	new: "待处理",
	not_interested: "不考虑",
	applied: "已投递",
	interview: "面试中",
	offer: "Offer",
	rejected: "未通过",
};

const TRACKING_FILTERS = [
	{ value: "all", label: "全部" },
	{ value: "favorite", label: "收藏" },
	{ value: "new", label: "待处理" },
	{ value: "applied", label: "已投递" },
	{ value: "interview", label: "面试中" },
	{ value: "offer", label: "Offer" },
	{ value: "rejected", label: "未通过" },
	{ value: "not_interested", label: "不考虑" },
] as const;

const REMOTE_LABELS: Record<JobRemoteType, string> = {
	remote: "远程",
	hybrid: "混合办公",
	onsite: "现场办公",
	unknown: "办公方式未注明",
};

type TrackingFilter = JobTrackingStatus | "all" | "favorite";
type RemoteFilter = JobRemoteType | "all";

function formatPublishedAt(value: string | null): string {
	if (!value) {
		return "发布时间未注明";
	}

	return formatDistanceToNow(new Date(value), {
		addSuffix: true,
		locale: zhCN,
	});
}

function JobCard({
	job,
	onTrackingPatch,
	onEditNotes,
	isUpdating,
}: {
	job: JobPostingItem;
	onTrackingPatch: (jobId: string, patch: JobTrackingPatch) => void;
	onEditNotes: (job: JobPostingItem) => void;
	isUpdating: boolean;
}) {
	const locations =
		job.locations.length > 0 ? job.locations.join("、") : "地点未注明";

	return (
		<article className="flex h-full flex-col rounded-lg border bg-card p-4 md:p-5">
			<div className="flex flex-1 flex-col">
				<div className="min-w-0 flex-1">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-secondary/50">
							<BriefcaseBusiness className="size-4 text-muted-foreground" />
						</div>
						<div className="min-w-0 flex-1">
							<a
								href={job.url}
								target="_blank"
								rel="noreferrer"
								className="group inline-flex max-w-full items-start gap-2 text-base font-semibold leading-snug hover:text-primary"
							>
								<span className="line-clamp-2">{job.title}</span>
								<ExternalLink className="mt-0.5 size-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
							</a>
							<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1.5">
									<Building2 className="size-3.5" />
									{job.company || "公司未注明"}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<MapPin className="size-3.5" />
									{locations}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<Banknote className="size-3.5" />
									{job.salaryText || "薪资未注明"}
								</span>
							</div>
						</div>
					</div>

					<p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
						{job.summary}
					</p>

					{(job.roleCategories.length > 0 || job.skills.length > 0) && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{job.roleCategories.map((category) => (
								<Badge
									key={category}
									variant="outline"
									className="border-primary/40 bg-primary/5 font-medium"
								>
									{category}
								</Badge>
							))}
							{job.skills.slice(0, 8).map((skill) => (
								<Badge key={skill} variant="secondary" className="font-normal">
									{skill}
								</Badge>
							))}
						</div>
					)}
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant={job.trackingNotes ? "secondary" : "ghost"}
							size="sm"
							onClick={() => onEditNotes(job)}
							title={job.trackingNotes ? "编辑备注" : "添加备注"}
						>
							<StickyNote />
							备注
						</Button>
						<Button
							type="button"
							variant={job.isFavorite ? "secondary" : "ghost"}
							size="icon-sm"
							onClick={() =>
								onTrackingPatch(job.id, { isFavorite: !job.isFavorite })
							}
							disabled={isUpdating}
							aria-label={job.isFavorite ? "取消收藏" : "收藏"}
							title={job.isFavorite ? "取消收藏" : "收藏"}
						>
							<Bookmark
								className={job.isFavorite ? "fill-current" : undefined}
							/>
						</Button>
						<Select
							value={job.trackingStatus}
							onValueChange={(value) =>
								onTrackingPatch(job.id, {
									status: value as JobTrackingStatus,
								})
							}
							disabled={isUpdating}
						>
							<SelectTrigger size="sm" className="w-24">
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								{Object.entries(TRACKING_LABELS).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{job.trackingStatus === "not_interested" ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => onTrackingPatch(job.id, { status: "new" })}
								disabled={isUpdating}
							>
								<RotateCcw />
								恢复
							</Button>
						) : (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									onTrackingPatch(job.id, { status: "not_interested" })
								}
								disabled={isUpdating}
							>
								<CircleOff />
								不考虑
							</Button>
						)}
					</div>
					<div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
						<Clock3 className="size-3.5" />
						{formatPublishedAt(job.publishedAt)}
					</div>
				</div>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
				<Badge variant="outline" className="font-normal">
					{job.sourceName}
				</Badge>
				<Badge variant="outline" className="font-normal">
					{REMOTE_LABELS[job.remoteType]}
				</Badge>
				{job.employmentType && (
					<Badge variant="outline" className="font-normal">
						{job.employmentType}
					</Badge>
				)}
				{job.experience && (
					<span className="min-w-0 flex-1 truncate" title={job.experience}>
						{job.experience}
					</span>
				)}
			</div>
		</article>
	);
}

export function JobsPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");
	const [sourceId, setSourceId] = useState("all");
	const [remoteType, setRemoteType] = useState<RemoteFilter>("all");
	const [roleCategory, setRoleCategory] = useState<"all" | JobRoleCategory>(
		"all",
	);
	const [skill, setSkill] = useState("all");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [trackingStatus, setTrackingStatus] = useState<TrackingFilter>("all");
	const [editingJob, setEditingJob] = useState<JobPostingItem | null>(null);
	const search = useDeferredValue(searchInput.trim());

	let favorite: boolean | undefined;
	let statusFilter: JobTrackingStatus | undefined;
	if (trackingStatus === "favorite") {
		favorite = true;
	} else if (trackingStatus !== "all") {
		statusFilter = trackingStatus;
	}

	const params = {
		page,
		limit: 20,
		search: search || undefined,
		sourceId: sourceId === "all" ? undefined : sourceId,
		remoteType:
			remoteType === "all" ? undefined : (remoteType as JobRemoteType),
		trackingStatus: statusFilter,
		favorite,
		roleCategory: roleCategory === "all" ? undefined : roleCategory,
		skill: skill === "all" ? undefined : skill,
		sortOrder,
	};
	const facetParams = {
		search: search || undefined,
		sourceId: sourceId === "all" ? undefined : sourceId,
		remoteType:
			remoteType === "all" ? undefined : (remoteType as JobRemoteType),
		trackingStatus: statusFilter,
		favorite,
		roleCategory: roleCategory === "all" ? undefined : roleCategory,
		skill: skill === "all" ? undefined : skill,
	};

	const jobsQuery = useQuery({
		queryKey: jobsApi.queryKeys.list(params),
		queryFn: () => jobsApi.getJobs(params),
	});
	const sourcesQuery = useQuery({
		queryKey: jobsApi.queryKeys.sources,
		queryFn: jobsApi.getSources,
	});
	const facetsQuery = useQuery({
		queryKey: jobsApi.queryKeys.facets(facetParams),
		queryFn: () => jobsApi.getFacets(facetParams),
	});

	useEffect(() => {
		if (!facetsQuery.data) {
			return;
		}

		if (
			skill !== "all" &&
			!facetsQuery.data.skills.some((facet) => facet.name === skill)
		) {
			setSkill("all");
			setPage(1);
			return;
		}

		if (
			roleCategory !== "all" &&
			!facetsQuery.data.roleCategories.some(
				(facet) => facet.name === roleCategory,
			)
		) {
			setRoleCategory("all");
			setPage(1);
		}
	}, [facetsQuery.data, roleCategory, skill]);
	const trackingMutation = useMutation({
		mutationFn: (input: { jobId: string; patch: JobTrackingPatch }) =>
			jobsApi.updateTracking(input.jobId, input.patch),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: jobsApi.queryKeys.all });
		},
	});
	const notesMutation = useMutation({
		mutationFn: (input: { jobId: string; notes: string | null }) =>
			jobsApi.updateTracking(input.jobId, { notes: input.notes }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: jobsApi.queryKeys.all });
			setEditingJob(null);
		},
	});

	const items = jobsQuery.data?.data || [];
	const total = Number.parseInt(jobsQuery.data?.meta?.total || "0", 10);
	const totalPages = jobsQuery.data?.meta?.totalPages || 0;

	return (
		<div className="min-h-screen bg-background p-4 text-foreground md:p-6">
			<PageHeader />

			<main className="mx-auto max-w-[1440px] space-y-4">
				<div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="text-lg font-semibold">工作</h1>
						<p className="text-sm text-muted-foreground">{total} 个有效职位</p>
					</div>
				</div>

				<div className="widget space-y-3 p-3">
					<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
						<div className="relative min-w-0 flex-1 md:max-w-sm">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchInput}
								onChange={(event) => {
									setSearchInput(event.target.value);
									setPage(1);
								}}
								placeholder="搜索岗位、公司或技能"
								className="h-9 pl-9"
							/>
						</div>

						<Select
							value={sourceId}
							onValueChange={(value) => {
								setSourceId(value);
								setRoleCategory("all");
								setSkill("all");
								setPage(1);
							}}
						>
							<SelectTrigger className="w-full md:w-40">
								<SelectValue placeholder="全部来源" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部来源</SelectItem>
								{sourcesQuery.data?.map((source) => (
									<SelectItem key={source.id} value={source.id}>
										{source.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={remoteType}
							onValueChange={(value) => {
								setRemoteType(value as RemoteFilter);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-full md:w-36">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部办公方式</SelectItem>
								<SelectItem value="remote">远程</SelectItem>
								<SelectItem value="hybrid">混合办公</SelectItem>
								<SelectItem value="onsite">现场办公</SelectItem>
								<SelectItem value="unknown">未注明</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={roleCategory}
							onValueChange={(value) => {
								setRoleCategory(value as "all" | JobRoleCategory);
								setSkill("all");
								setPage(1);
							}}
						>
							<SelectTrigger className="w-full md:w-40">
								<SelectValue placeholder="全部岗位方向" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部岗位方向</SelectItem>
								{JOB_ROLE_CATEGORIES.map((category) => {
									const facet = facetsQuery.data?.roleCategories.find(
										(item) => item.name === category,
									);
									if (!facet) {
										return null;
									}
									return (
										<SelectItem key={category} value={category}>
											{category} ({facet.count})
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>

						<SkillFilter
							value={skill}
							facets={facetsQuery.data?.skills || []}
							isLoading={facetsQuery.isLoading}
							onValueChange={(value) => {
								setSkill(value);
								setPage(1);
							}}
						/>

						<Select
							value={sortOrder}
							onValueChange={(value) => {
								setSortOrder(value as "asc" | "desc");
								setPage(1);
							}}
						>
							<SelectTrigger className="w-full md:w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="desc">时间倒序（最新优先）</SelectItem>
								<SelectItem value="asc">时间正序（最早优先）</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex max-w-full flex-wrap gap-1">
						{TRACKING_FILTERS.map((filter) => (
							<Button
								key={filter.value}
								type="button"
								variant={
									trackingStatus === filter.value ? "secondary" : "ghost"
								}
								size="sm"
								onClick={() => {
									setTrackingStatus(filter.value);
									setPage(1);
								}}
							>
								{filter.value === "favorite" && <Bookmark />}
								{filter.label}
							</Button>
						))}
					</div>

					{trackingMutation.error && (
						<p className="text-xs text-destructive">状态更新失败</p>
					)}
				</div>

				{jobsQuery.isLoading && (
					<div className="widget p-4">
						<WidgetLoadingState lines={6} variant="card" />
					</div>
				)}

				{jobsQuery.error && (
					<div className="widget p-4">
						<WidgetErrorState
							error={jobsQuery.error as Error}
							onRetry={() => jobsQuery.refetch()}
							message="职位加载失败"
						/>
					</div>
				)}

				{!jobsQuery.isLoading && !jobsQuery.error && items.length === 0 && (
					<div className="widget p-4">
						<WidgetEmptyState message="没有找到职位" />
					</div>
				)}

				{items.length > 0 && (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
						{items.map((job) => (
							<JobCard
								key={job.id}
								job={job}
								onTrackingPatch={(jobId, patch) =>
									trackingMutation.mutate({ jobId, patch })
								}
								onEditNotes={(selectedJob) => {
									notesMutation.reset();
									setEditingJob(selectedJob);
								}}
								isUpdating={
									trackingMutation.isPending &&
									trackingMutation.variables?.jobId === job.id
								}
							/>
						))}
					</div>
				)}

				{totalPages > 1 && (
					<div className="flex justify-end py-2">
						<Pagination
							currentPage={page}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</div>
				)}
			</main>

			<JobNotesDialog
				job={editingJob}
				isSaving={notesMutation.isPending}
				error={notesMutation.error}
				onOpenChange={(open) => {
					if (!open && !notesMutation.isPending) {
						setEditingJob(null);
						notesMutation.reset();
					}
				}}
				onSave={(notes) => {
					if (editingJob) {
						notesMutation.mutate({ jobId: editingJob.id, notes });
					}
				}}
			/>
		</div>
	);
}

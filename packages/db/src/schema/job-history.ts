// packages/db/src/schema/job-history.ts
/**
 * 任务历史表
 *
 * 用于持久化存储 BullMQ 队列任务的执行历史。
 * 记录每个任务的完整生命周期，包括成功、失败、执行时间等信息。
 * 支持长期监控、趋势分析和问题排查。
 */
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const jobHistory = pgTable(
	"job_history",
	{
		/** 主键，自增 ID */
		id: serial("id").primaryKey(),

		// ========== 任务标识信息 ==========

		/** BullMQ 任务 ID */
		jobId: text("job_id").notNull(),

		/** 任务名称（通常是 "process"） */
		jobName: text("job_name").notNull().default("process"),

		// ========== 内容信息 ==========

		/** 数据源类型（rss, twitter, v2ex 等） */
		sourceType: text("source_type"),

		/** 内容 URL */
		url: text("url"),

		/** 外部 ID */
		externalId: text("external_id"),

		// ========== 执行状态 ==========

		/** 任务状态：completed 或 failed */
		status: text("status").notNull(),

		/** 是否成功（针对 completed 状态，表示业务逻辑是否成功） */
		success: boolean("success"),

		// ========== 时间信息 ==========

		/** 任务开始处理时间 */
		startedAt: timestamp("started_at", { withTimezone: true }).notNull(),

		/** 任务完成时间 */
		finishedAt: timestamp("finished_at", { withTimezone: true }).notNull(),

		/** 执行耗时（毫秒） */
		duration: integer("duration"),

		// ========== 错误信息 ==========

		/** 失败原因（仅 failed 状态） */
		failedReason: text("failed_reason"),

		/** 错误堆栈（仅 failed 状态） */
		stacktrace: text("stacktrace"),

		// ========== 结果信息 ==========

		/** 任务返回值（JSON 格式） */
		returnValue: jsonb("return_value"),

		// ========== 元数据 ==========

		/** 记录创建时间 */
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		// 索引：按任务 ID 查询
		jobIdIdx: index("job_history_job_id_idx").on(table.jobId),
		// 索引：按状态查询
		statusIdx: index("job_history_status_idx").on(table.status),
		// 索引：按完成时间查询（用于时间范围查询和排序）
		finishedAtIdx: index("job_history_finished_at_idx").on(table.finishedAt),
		// 索引：按数据源类型查询
		sourceTypeIdx: index("job_history_source_type_idx").on(table.sourceType),
		// 索引：按创建时间查询
		createdAtIdx: index("job_history_created_at_idx").on(table.createdAt),
	}),
);

/** 任务历史类型（从 schema 推断） */
export type JobHistory = typeof jobHistory.$inferSelect;

/** 插入任务历史类型（从 schema 推断） */
export type InsertJobHistory = typeof jobHistory.$inferInsert;

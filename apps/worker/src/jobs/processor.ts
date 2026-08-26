import type { AiClient } from "@intellipick/ai";
import { db, jobPostings } from "@intellipick/db";
import { JOB_ROLE_CATEGORIES } from "@intellipick/shared";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createLogger } from "../lib/logger";
import { normalizeJobSkills } from "./skills";
import type { JobProcessingResult, RawJobPosting } from "./types";

const logger = createLogger("jobs-processor");

const JobExtractionSchema = z.object({
	isJobPosting: z.boolean(),
	rejectionReason: z.string().nullable(),
	title: z.string(),
	company: z.string().nullable(),
	roleCategories: z.array(z.enum(JOB_ROLE_CATEGORIES)).min(1),
	locations: z.array(z.string()),
	remoteType: z.enum(["remote", "hybrid", "onsite", "unknown"]),
	employmentType: z.string().nullable(),
	salaryText: z.string().nullable(),
	experience: z.string().nullable(),
	skills: z.array(z.string()),
	summary: z.string(),
	requirements: z.array(z.string()),
	benefits: z.array(z.string()),
	application: z.string().nullable(),
});

const JOB_EXTRACTION_PROMPT = `你是一个只服务于求职者的招聘信息分析器。

先判断内容是否为企业、团队或招聘方发布的明确招聘岗位。

以下内容不属于招聘岗位：
- 职场讨论、面试经验、职业规划和行业文章
- 求职者自荐、个人简历和寻找合作
- 培训课程、付费咨询、拉群和纯广告
- 没有具体岗位或职责的信息

有效招聘信息应当包含明确岗位，并至少提供公司或团队、地点或远程方式、技能要求、薪资、工作职责、应聘方式中的一项。

字段要求：
- isJobPosting：是否为有效招聘岗位
- rejectionReason：无效时说明原因，有效时为 null
- title：规范化岗位名称
- company：公司或团队，未知为 null
- roleCategories：岗位方向，可多选，必须从以下值中选择：${JOB_ROLE_CATEGORIES.join("、")}
  - 前端开发：浏览器、Web UI、React、Vue 等前端岗位
  - 后端开发：服务端、Java、Go、Node.js、Rust 等后端岗位
  - 全栈开发：明确同时承担前端和后端的岗位
  - AI / Agent：LLM 应用、Agent、RAG、AI 平台和模型工程岗位
  - Java、Go、Python、React 等语言和框架只能放入 skills，不能作为岗位方向
  - 同一招聘帖包含多个岗位时，应返回所有匹配方向
- locations：工作地点数组，未知为空数组
- remoteType：remote、hybrid、onsite、unknown 四选一
- employmentType：全职、兼职、实习、合同等，未知为 null
- salaryText：保留原文薪资表达，未知为 null
- experience：保留原文经验要求，未知为 null
- skills：只保留语言、框架、数据库、平台和工程工具等明确技术名词，去除职责描述和宽泛能力，最多 12 项
- summary：一到两句话概括岗位
- requirements：主要任职要求
- benefits：福利或岗位亮点
- application：应聘方式，未知为 null

即使内容无效，也必须返回所有字段；字符串使用空字符串或 null，数组使用空数组。

标题：{{title}}
作者：{{author}}
正文：
{{content}}`;

export async function processJobPosting(
	raw: RawJobPosting,
	ai: AiClient,
): Promise<JobProcessingResult> {
	const prompt = JOB_EXTRACTION_PROMPT.replace("{{title}}", raw.title)
		.replace("{{author}}", raw.author || "未知")
		.replace("{{content}}", raw.content);

	const { object } = await generateObject({
		model: ai.getModel("extractAndClassify"),
		schema: JobExtractionSchema,
		prompt,
	});

	if (!object.isJobPosting) {
		const backfillPostingId = raw.rawData.backfillPostingId;
		if (
			raw.rawData.backfill === true &&
			typeof backfillPostingId === "string"
		) {
			await db
				.update(jobPostings)
				.set({ status: "filtered", updatedAt: new Date() })
				.where(eq(jobPostings.id, backfillPostingId));
		}
		logger.info(
			{ url: raw.url, reason: object.rejectionReason, backfillPostingId },
			"Rejected non-job content",
		);
		return {
			stored: false,
			reason: object.rejectionReason || "不是明确招聘信息",
		};
	}
	const skills = normalizeJobSkills(object.skills);

	const [posting] = await db
		.insert(jobPostings)
		.values({
			sourceId: raw.sourceId,
			externalId: raw.externalId,
			url: raw.url,
			title: object.title || raw.title,
			company: object.company,
			roleCategories: object.roleCategories,
			locations: object.locations,
			remoteType: object.remoteType,
			employmentType: object.employmentType,
			salaryText: object.salaryText,
			experience: object.experience,
			skills,
			summary: object.summary,
			requirements: object.requirements,
			benefits: object.benefits,
			application: object.application,
			rawContent: raw.content,
			rawData: raw.rawData,
			publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
			collectedAt: new Date(raw.collectedAt),
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: [jobPostings.sourceId, jobPostings.externalId],
			set: {
				url: raw.url,
				title: object.title || raw.title,
				company: object.company,
				roleCategories: object.roleCategories,
				locations: object.locations,
				remoteType: object.remoteType,
				employmentType: object.employmentType,
				salaryText: object.salaryText,
				experience: object.experience,
				skills,
				summary: object.summary,
				requirements: object.requirements,
				benefits: object.benefits,
				application: object.application,
				rawContent: raw.content,
				rawData: raw.rawData,
				publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
				collectedAt: new Date(raw.collectedAt),
				status: "active",
				updatedAt: new Date(),
			},
		})
		.returning({ id: jobPostings.id });

	logger.info({ url: raw.url, postingId: posting.id }, "Stored job posting");
	return { stored: true, postingId: posting.id };
}

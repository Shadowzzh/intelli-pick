import type { ExtractResult } from "@intellipick/shared";
// apps/api/src/pipeline/ai-extract.ts
import { generateObject } from "ai";
import type { Logger } from "pino";
import { z } from "zod";
import type { AiClient } from "../lib/ai";
import { createLogger } from "../lib/logger";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("ai-extract");

const ExtractResultSchema = z.object({
	title: z.string(),
	summary: z.string(),
	keyPoints: z.array(z.string()),
	dataPoints: z.array(z.string()),
	entities: z.array(
		z.object({
			name: z.string(),
			type: z.string(), // 完全开放,允许 AI 自由定义
			url: z.string().optional(),
			description: z.string().optional(),
		}),
	),
	category: z.enum([
		"technology", // 技术
		"business", // 商业
		"product", // 产品
		"career", // 职场
		"news", // 资讯
		"lifestyle", // 生活
		"other", // 其他
	]),
	subCategory: z.string().optional(), // 二级分类，AI 自由生成
	tags: z.array(z.string()),
});

const EXTRACT_PROMPT = `你是一个内容分析器。从以下内容中提取结构化信息。

## 必须返回的字段

### title (必需)
- 如果原文有标题，使用原标题
- 如果没有（如推文），生成一个简洁的标题（<20字）

### summary (必需)
- 用 1-2 句话总结核心内容
- 保留关键信息，去除冗余

### keyPoints (必需)
- 提取核心观点、结论、主张
- 每条观点独立成句
- 最多 5 条
- 如果没有明确观点，返回空数组 []

### dataPoints (必需)
- 提取具体数字、量化信息
- 如：融资金额、性能数据、用户数、价格等
- 格式："[指标] [数值]"
- 如果没有数据点，返回空数组 []

### entities (必需)
实体对象数组,每个实体包含:
- name: 实体名称
- type: 实体类型 (如 person、company、country、location、organization、product 等)
- url: (可选) 相关URL
- description: (可选) 简短描述

注意事项:
- 只提取明确提到的实体,不要推断
- type 可以是任何描述实体类型的字符串
- 常见类型参考: person、company、country、location、organization、product、tool、project、library、article、event
**重要 - 必须排除的实体**:
  1. 不要提取内容来源平台本身作为实体
     - 判断标准：如果实体名称就是内容发布平台的名称（或高度相似），则不提取
     - 例如：在"36氪"的文章中不要提取"36氪"，在"V2EX"的帖子中不要提取"V2EX"
     - 例如：在"少数派"的文章中不要提取"少数派"，在"Twitter"的推文中不要提取"Twitter"或"X"
  2. 特别注意：当前已知的内容来源平台包括（但不仅限于）：
     {{sourceList}}
  3. 但可以提取内容中提到的其他公司、产品、人物等实体
     - 例如：在36氪的文章中提到"字节跳动推出新产品"，应该提取"字节跳动"，但不提取"36氪"
- 如果没有符合条件的实体,返回空数组 []

### category (必需) - 一级分类
必须从以下 7 个分类中选择一个：

1. **technology** (技术) - 技术开发、编程、AI、工具等
   - 例如：编程语言、框架、云服务、开源项目、技术教程等

2. **business** (商业) - 创业、融资、公司、市场等
   - 例如：初创公司、融资新闻、市场分析、商业案例、投资并购等

3. **product** (产品) - 产品设计、用户体验、运营等
   - 例如：UI/UX设计、产品设计、增长策略、内容运营、工具推荐等

4. **career** (职场) - 职业发展、工作效率、学习成长等
   - 例如：职业规划、求职面试、时间管理、学习成长、远程工作等

5. **news** (资讯) - 行业动态、新闻热点、趋势分析等
   - 例如：行业动态、政策法规、重大事件、热点追踪、趋势预测等

6. **lifestyle** (生活) - 生活方式、健康、旅行、美食等
   - 例如：健康养生、旅行攻略、美食探店、运动健身、兴趣爱好等

7. **other** (其他) - 不便分类的内容

### subCategory (可选) - 二级分类
- 根据内容自由生成更具体的二级分类
- 例如：技术类可以是 "AI/LLM"、"前端开发" 等；商业类可以是 "创业融资"、"市场分析" 等
- 2-4 个字，简洁明了
- 如果内容已经很明确，可以省略

### tags (必需) - 标签
- 从以下推荐标签库中选择，或根据内容生成新的标签
- 3-7 个标签
- 优先使用推荐标签，如果推荐标签不合适，可以生成新的
- 推荐标签库：

**技术类标签**：
编程语言: JavaScript, TypeScript, Python, Go, Rust, Java, C++, PHP, Swift, Kotlin
框架库: React, Vue, Next.js, Nuxt, Express, Fastify, Django, Spring, Flutter, React Native
AI/ML: GPT, Claude, Llama, LangChain, 向量数据库, RAG, 机器学习, 深度学习
云服务: AWS, Azure, GCP, Vercel, Cloudflare, 阿里云, 腾讯云
前端: CSS, Tailwind, Webpack, Vite, 浏览器, 性能优化
后端: Node.js, PostgreSQL, Redis, MongoDB, MySQL, GraphQL, REST API
DevOps: Docker, Kubernetes, CI/CD, GitHub Actions, GitLab CI
移动: iOS, Android, Swift, Kotlin, 跨平台
其他: 开源, 安全, 微服务, 分布式, 算法, 数据结构

**商业类标签**：
创业: 初创公司, 独立开发, SaaS, B2B, B2C, MVP, 产品市场匹配
融资: 天使投资, VC, PE, IPO, 估值, 融资新闻, 路演
公司: 字节跳动, 阿里, 腾讯, 微软, Google, Meta, Apple, Amazon
市场: 市场分析, 竞品分析, 商业模式, 盈利模式, 增长策略
投资: 股票, 基金, 加密货币, Web3, 区块链
其他: 商业案例, 创业故事, 失败复盘, 独角兽

**产品类标签**：
设计: UI设计, UX设计, 交互设计, 视觉设计, 设计系统, Figma
产品: 产品经理, 需求分析, 用户调研, MVP, 产品迭代
运营: 增长黑客, 内容运营, 社群运营, SEO, 用户增长
数据: 数据分析, AB测试, 用户行为, 指标, 数据驱动
工具: 生产力工具, No-code, Low-code, SaaS, 效率工具
其他: 用户体验, 转化率, 留存, 活跃度, NPS

**职场类标签**：
职业: 职业规划, 转行, 求职, 面试, 简历, 薪资, 谈薪
技能: 软技能, 领导力, 沟通, 演讲, 协作, 团队管理
学习: 教程, 课程, 书籍推荐, 笔记, 知识管理
效率: 时间管理, 生产力, 工具, 自动化, 工作流
工作: 远程工作, 自由职业, 副业, 斜杠, 内卷, 躺平
其他: 职场故事, 职场情商, 晋升, 离职, 创业

**资讯类标签**：
类型: 突发新闻, 行业动态, 政策解读, 重大事件
时效: 热点, 趋势, 回顾, 预测, 盘点
深度: 快讯, 深度报道, 分析评论, 调查报告
其他: 月度总结, 年度回顾, 未来展望

**生活类标签**：
健康: 养生, 运动, 健身, 心理健康, 睡眠, 饮食
生活: 旅行, 美食, 家居, 摄影, 汽车, 购物
兴趣: 阅读, 游戏, 音乐, 电影, 追剧, 动漫
其他: 生活技巧, 省钱, 极简, 断舍离

**通用标签**：
形式: 视频, 播客, 长文, 短文, 图解, 教程, 观点, 资源
深度: 入门, 进阶, 深度分析, 快速浏览
时效: 热点, 趋势, 回顾, 预测
语言: 中文, 英文, 双语
其他: 免费, 付费, 开源, 闭源

## 输入
{{content}}

根据以上要求，输出完整的 JSON 结果，确保所有字段都存在且类型正确。`;

export class AiExtractStep implements PipelineStep {
	name = "ai-extract";

	constructor(
		private ai: AiClient,
		private sourceNames: string[] = [],
	) {}

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;
		const { raw, sourceNames } = ctx;

		// 如果是 quarantine，跳过提取
		if (ctx.filterResult?.decision === "quarantine") {
			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		}

		// 替换占位符
		let prompt = EXTRACT_PROMPT.replace("{{content}}", raw.content);

		// 动态插入 source 列表
		if (sourceNames && sourceNames.length > 0) {
			const sourceList = sourceNames.map((name) => `     - ${name}`).join("\n");
			prompt = prompt.replace("{{sourceList}}", sourceList);
		} else {
			// 如果没有 sourceNames，移除那部分提示
			prompt = prompt.replace(
				"  2. 特别注意：当前已知的内容来源平台包括（但不仅限于）：\n     {{sourceList}}\n",
				"",
			);
		}

		try {
			const { object } = await generateObject({
				model: this.ai.getModel("extractAndClassify"),
				schema: ExtractResultSchema,
				prompt,
			});

			ctx.extractResult = object as ExtractResult;

			log.info(
				{
					url: raw.url,
					title: ctx.extractResult.title,
					category: ctx.extractResult.category,
					tags: ctx.extractResult.tags,
					entitiesCount: ctx.extractResult.entities.length,
				},
				"AI extract result",
			);

			return {
				status: StepStatus.Continue,
				context: ctx,
			};
		} catch (err) {
			log.error({ url: raw.url, err }, "AI extract failed");
			return {
				status: StepStatus.Error,
				error: err as Error,
			};
		}
	}
}

/**
 * 内容分类和标签常量
 *
 * 用于 AI 内容提取和分类的标准化定义
 * 确保在 worker 和 api 之间保持一致性
 */

/**
 * 一级分类 - 严格枚举（中文字面量）
 * AI 必须从这 7 个分类中选择一个
 */
export const CONTENT_CATEGORIES = {
	TECHNOLOGY: "技术",
	BUSINESS: "商业",
	PRODUCT: "产品",
	CAREER: "职场",
	NEWS: "资讯",
	LIFESTYLE: "生活",
	OTHER: "其他",
} as const;

export type ContentCategory =
	(typeof CONTENT_CATEGORIES)[keyof typeof CONTENT_CATEGORIES];

/**
 * 所有分类值的数组（用于 zod enum）
 * 使用 as const 确保类型为字面量元组
 */
export const CONTENT_CATEGORY_VALUES = [
	"技术",
	"商业",
	"产品",
	"职场",
	"资讯",
	"生活",
	"其他",
] as const;

/**
 * 二级分类 - 推荐列表
 *
 * 目的：
 * - 提高 AI 输出的一致性（避免"AI/LLM"vs"大模型"vs"LLM"）
 * - 但 AI 可以自由生成新的二级分类
 */
export const RECOMMENDED_SUBCATEGORIES = {
	technology: [
		"AI/LLM",
		"前端开发",
		"后端开发",
		"移动开发",
		"DevOps",
		"云服务",
		"数据库",
		"网络安全",
		"算法",
		"开源",
	],
	business: [
		"创业融资",
		"市场分析",
		"投资并购",
		"商业模式",
		"行业动态",
		"公司动态",
		"独角兽",
	],
	product: [
		"产品设计",
		"UI/UX设计",
		"用户增长",
		"内容运营",
		"数据分析",
		"工具推荐",
		"设计系统",
	],
	career: [
		"职业规划",
		"求职面试",
		"技能提升",
		"时间管理",
		"远程工作",
		"自由职业",
		"领导力",
	],
	news: [
		"政策法规",
		"重大事件",
		"热点追踪",
		"趋势预测",
		"行业报告",
		"突发新闻",
	],
	lifestyle: [
		"健康养生",
		"旅行攻略",
		"美食探店",
		"运动健身",
		"个人理财",
		"兴趣爱好",
	],
} as const;

/**
 * 标签 - 推荐列表
 *
 * 目的：
 * - 提供 AI 常用标签参考
 * - 但 AI 可以自由生成新的标签
 */
export const RECOMMENDED_TAGS = {
	technology: [
		// 编程语言
		"JavaScript",
		"TypeScript",
		"Python",
		"Go",
		"Rust",
		"Java",
		"C++",
		"PHP",
		"Swift",
		"Kotlin",
		// 框架库
		"React",
		"Vue",
		"Next.js",
		"Nuxt",
		"Express",
		"Fastify",
		"Django",
		"Spring",
		"Flutter",
		"React Native",
		// AI/ML
		"AI",
		"GPT",
		"Claude",
		"Llama",
		"LLM",
		"LangChain",
		"向量数据库",
		"RAG",
		"机器学习",
		"深度学习",
		// 云服务
		"AWS",
		"Azure",
		"GCP",
		"Vercel",
		"Cloudflare",
		"阿里云",
		"腾讯云",
		// 前端
		"CSS",
		"Tailwind",
		"Webpack",
		"Vite",
		"浏览器",
		"性能优化",
		// 后端
		"Node.js",
		"PostgreSQL",
		"Redis",
		"MongoDB",
		"MySQL",
		"GraphQL",
		"REST API",
		// DevOps
		"Docker",
		"Kubernetes",
		"CI/CD",
		"GitHub Actions",
		"GitLab CI",
		// 移动
		"iOS",
		"Android",
		"Swift",
		"Kotlin",
		"跨平台",
		// 其他
		"开源",
		"安全",
		"微服务",
		"分布式",
		"算法",
		"数据结构",
	],
	business: [
		"创业",
		"初创公司",
		"独立开发",
		"SaaS",
		"B2B",
		"B2C",
		"MVP",
		"产品市场匹配",
		// 融资
		"天使投资",
		"VC",
		"PE",
		"IPO",
		"估值",
		"融资新闻",
		"路演",
		// 公司
		"字节跳动",
		"阿里",
		"腾讯",
		"微软",
		"Google",
		"Meta",
		"Apple",
		"Amazon",
		// 市场
		"市场分析",
		"竞品分析",
		"商业模式",
		"盈利模式",
		"增长策略",
		// 投资
		"股票",
		"基金",
		"加密货币",
		"Web3",
		"区块链",
		// 其他
		"商业案例",
		"创业故事",
		"失败复盘",
		"独角兽",
	],
	product: [
		// 设计
		"UI设计",
		"UX设计",
		"交互设计",
		"视觉设计",
		"设计系统",
		"Figma",
		// 产品
		"产品经理",
		"需求分析",
		"用户调研",
		"MVP",
		"产品迭代",
		// 运营
		"增长黑客",
		"内容运营",
		"社群运营",
		"SEO",
		"用户增长",
		// 数据
		"数据分析",
		"AB测试",
		"用户行为",
		"指标",
		"数据驱动",
		// 工具
		"生产力工具",
		"No-code",
		"Low-code",
		"SaaS",
		"效率工具",
		// 其他
		"用户体验",
		"转化率",
		"留存",
		"活跃度",
		"NPS",
	],
	career: [
		// 职业
		"职业规划",
		"转行",
		"求职",
		"面试",
		"简历",
		"薪资",
		"谈薪",
		// 技能
		"软技能",
		"领导力",
		"沟通",
		"演讲",
		"协作",
		"团队管理",
		// 学习
		"教程",
		"课程",
		"书籍推荐",
		"笔记",
		"知识管理",
		// 效率
		"时间管理",
		"生产力",
		"工具",
		"自动化",
		"工作流",
		// 工作
		"远程工作",
		"自由职业",
		"副业",
		"斜杠",
		"内卷",
		"躺平",
		// 其他
		"职场故事",
		"职场情商",
		"晋升",
		"离职",
		"创业",
	],
	news: [
		// 类型
		"突发新闻",
		"行业动态",
		"政策解读",
		"重大事件",
		// 时效
		"热点",
		"趋势",
		"回顾",
		"预测",
		"盘点",
		// 深度
		"快讯",
		"深度报道",
		"分析评论",
		"调查报告",
		// 其他
		"月度总结",
		"年度回顾",
		"未来展望",
	],
	lifestyle: [
		// 健康
		"养生",
		"运动",
		"健身",
		"心理健康",
		"睡眠",
		"饮食",
		// 生活
		"旅行",
		"美食",
		"家居",
		"摄影",
		"汽车",
		"购物",
		// 兴趣
		"阅读",
		"游戏",
		"音乐",
		"电影",
		"追剧",
		"动漫",
		// 其他
		"生活技巧",
		"省钱",
		"极简",
		"断舍离",
	],
	general: [
		// 形式
		"视频",
		"播客",
		"长文",
		"短文",
		"图解",
		"教程",
		"观点",
		"资源",
		// 深度
		"入门",
		"进阶",
		"深度分析",
		"快速浏览",
		// 时效
		"热点",
		"趋势",
		"回顾",
		"预测",
		// 语言
		"中文",
		"英文",
		"双语",
		// 其他
		"免费",
		"付费",
		"开源",
		"闭源",
	],
} as const;

/**
 * 扁平化的常用标签（用于 AI tools 描述）
 * 从各个分类中选择最常见的标签
 */
export const COMMON_TAG_EXAMPLES = [
	// 技术
	"JavaScript",
	"TypeScript",
	"React",
	"Vue",
	"Next.js",
	"AI",
	"GPT",
	"Claude",
	"LLM",
	"Node.js",
	"PostgreSQL",
	"Docker",
	// 商业
	"初创公司",
	"独立开发",
	"融资",
	"VC",
	"商业模式",
	"市场分析",
	// 产品
	"UI设计",
	"UX设计",
	"产品经理",
	"增长黑客",
	"数据分析",
	"Figma",
	// 职场
	"职业规划",
	"面试",
	"时间管理",
	"远程工作",
	"自由职业",
	// 资讯
	"突发新闻",
	"行业动态",
	"深度分析",
	"热点",
	// 通用
	"教程",
	"视频",
	"播客",
	"开源",
];

/**
 * 格式化标签列表用于 AI 提示词
 *
 * @returns 格式化的标签字符串
 *
 * @example
 * ```ts
 * const prompt = `推荐标签库：
 * ${formatTagsForPrompt()}
 *
 * 注意：可以生成新的标签`;
 * ```
 */
export function formatTagsForPrompt(): string {
	return Object.entries(RECOMMENDED_TAGS)
		.map(([category, tags]) => {
			const categoryLabel = {
				technology: "技术类",
				business: "商业类",
				product: "产品类",
				career: "职场类",
				news: "资讯类",
				lifestyle: "生活类",
				general: "通用",
			}[category];

			return `**${categoryLabel}**：\n${tags.slice(0, 15).join(", ")}`;
		})
		.join("\n\n");
}

/**
 * 格式化二级分类列表用于 AI 提示词
 *
 * @returns 格式化的二级分类字符串
 *
 * @example
 * ```ts
 * const prompt = `推荐二级分类：
 * ${formatSubCategoriesForPrompt()}
 *
 * 注意：可以生成新的二级分类`;
 * ```
 */
export function formatSubCategoriesForPrompt(): string {
	return Object.entries(RECOMMENDED_SUBCATEGORIES)
		.map(([cat, subcats]) => {
			const categoryLabel = {
				technology: "技术",
				business: "商业",
				product: "产品",
				career: "职场",
				news: "资讯",
				lifestyle: "生活",
			}[cat];

			return `${categoryLabel}: ${subcats.join("、")}`;
		})
		.join("\n");
}

/**
 * 格式化分类信息用于 AI tools 描述
 *
 * @returns 格式化的分类信息字符串
 */
export function formatCategoriesForTools(): string {
	return CONTENT_CATEGORY_VALUES.join("、");
}

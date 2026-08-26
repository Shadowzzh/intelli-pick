export const JOB_ROLE_CATEGORIES = [
	"前端开发",
	"后端开发",
	"全栈开发",
	"移动端",
	"AI / Agent",
	"算法",
	"数据工程",
	"DevOps / 运维",
	"测试 / QA",
	"网络安全",
	"产品",
	"设计",
	"运营 / 商务",
	"其他",
] as const;

export type JobRoleCategory = (typeof JOB_ROLE_CATEGORIES)[number];

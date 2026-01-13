# 运行前的提示

<instructions>
这是个运行 claude cli 前，让 AI 进行一个对本项目架构/组织的一个快速了解，方式不是直接写入上下文，而是让 AI 自动去搜索需要的上下文。
</instructions>

<thinking>
1.这个是 monorepo 项目, 你需要检查 packages 和 apps 下面的文件夹，写代码时自行判断如何进行代码组织。

2.在修改代码时，需要检查该代码是否是通用或封装过的逻辑，你需要去检查影响范围，修改原有逻辑而不是重新写逻辑。

2.行任务就结束后需执行 pnpm typecheck 和 pnpm lint 修复代码
</thinking>
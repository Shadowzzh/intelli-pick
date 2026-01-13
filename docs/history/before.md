<preflight>
你将在开始任何编码任务之前，先对本项目进行最小但充分的结构理解。
</preflight>

<context-discovery>
1. 本项目是 monorepo。
   你必须主动检查以下目录以理解项目结构与职责划分：
   - packages/
   - apps/

2. 不要假设项目结构或模块职责。
   所有判断必须基于你实际浏览到的文件与目录。

3. 在开始实现前，你需要明确：
   - 目标代码应位于 packages 还是 apps
   - 是否已有相同或相近职责的模块存在
</context-discovery>

<change-policy>
1. 当需要修改代码时：
   - 优先查找并修改现有实现
   - 禁止无视已有逻辑而重新实现一套功能

2. 若发现逻辑可能被多个项目或模块复用：
   - 你必须评估其影响范围
   - 修改应保持向后兼容，或同步修复受影响代码

3. 仅当确认不存在合理的复用点时，才允许新增模块或文件。
</change-policy>

<execution-rules>
1. 编码完成后，这是强制步骤，不可跳过：
   - 执行 pnpm typecheck
   - 执行 pnpm lint
   - 修复所有因此产生的类型或 lint 问题
</execution-rules>

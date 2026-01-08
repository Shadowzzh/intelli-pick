# 实现计划：排除数据源名称作为实体

## 问题描述
当前系统会将数据源名称(如"36氪"、"V2EX")当作实体提取和统计，导致这些数据源的mentionCount虚高，不符合实际需求。

## 解决方案
采用"双重保险"策略：
1. **AI层面**：在提示词中告诉AI不要提取数据源名称
2. **存储层面**：在插入实体前过滤掉数据源名称

## 实现步骤

### 步骤 1: 扩展 PipelineContext
**文件**: `apps/api/src/pipeline/types.ts`

在 `PipelineContext` 接口中添加 `sourceNames` 字段：

```typescript
export interface PipelineContext {
  raw: RawContent;
  filterResult?: FilterResult;
  extractResult?: ExtractResult;
  sourceNames?: string[];  // 新增：所有数据源名称列表
}
```

**验证**: TypeScript 编译通过

### 步骤 2: 修改 Pipeline 构造函数
**文件**: `apps/api/src/pipeline/index.ts`

修改构造函数接收完整的 Config，并提取 source 名称：

```typescript
constructor(config: Config, ai: AiClient) {
  // 提取所有 source 名称
  const sourceNames = config.sources.map(s => s.name);

  this.steps = [
    new DedupStep(),  // 需要移到最前面
    new HardFilterStep(config.filter.hardRules),
    new AiFilterStep(ai, config.filter, sourceNames),
    new AiExtractStep(ai, sourceNames),
    new StorageStep(config.filter, sourceNames),
  ];
}
```

在 `process()` 方法中初始化 context：

```typescript
async process(raw: RawContent, requestId?: string): Promise<boolean> {
  const requestLogger = requestId
    ? createRequestLogger("pipeline", requestId)
    : logger;

  // 提取 source 名称（从构造函数的 config）
  const sourceNames = this.config.sources.map(s => s.name);

  let ctx: PipelineContext = {
    raw,
    sourceNames  // 新增
  };
  // ... 其余代码
}
```

**验证**: TypeScript 编译通过

### 步骤 3: 修改 AiExtractStep
**文件**: `apps/api/src/pipeline/ai-extract.ts`

修改构造函数接收 sourceNames：

```typescript
export class AiExtractStep implements PipelineStep {
  name = "ai-extract";

  constructor(private ai: AiClient, private sourceNames: string[] = []) {}
```

修改 EXTRACT_PROMPT，添加排除规则：

```typescript
const EXTRACT_PROMPT = `你是一个内容分析器。从以下内容中提取结构化信息。

## 必须返回的字段
// ... (现有字段)

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
- **重要**: 不要提取以下数据源名称作为实体: {{sourceNames}}
- 如果没有符合条件的实体,返回空数组 []

## 输入
{{content}}

根据以上要求，输出完整的 JSON 结果，确保所有字段都存在且类型正确。`;
```

在 `process()` 方法中替换占位符：

```typescript
async process(ctx: PipelineContext, stepLogger?: Logger): Promise<StepResult> {
  const log = stepLogger || logger;
  const { raw } = ctx;

  // 如果是 quarantine，跳过提取
  if (ctx.filterResult?.decision === "quarantine") {
    return {
      status: StepStatus.Continue,
      context: ctx,
    };
  }

  // 替换 content 和 sourceNames 占位符
  let prompt = EXTRACT_PROMPT.replace("{{content}}", raw.content);
  if (this.sourceNames.length > 0) {
    prompt = prompt.replace("{{sourceNames}}", this.sourceNames.join("、"));
  } else {
    // 如果没有 sourceNames，移除那行提示
    prompt = prompt.replace(/\*\*重要\*\*: 不要提取以下数据源名称作为实体: {{sourceNames}}\n-/, "");
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
```

**验证**: TypeScript 编译通过

### 步骤 4: 修改 StorageStep
**文件**: `apps/api/src/pipeline/storage.ts`

修改构造函数接收 sourceNames：

```typescript
export class StorageStep implements PipelineStep {
  name = "storage";

  constructor(
    private config: Config["filter"],
    private sourceNames: string[] = []
  ) {}
```

在存储实体前添加过滤逻辑：

```typescript
// 存储实体和关联
if (extractResult?.entities) {
  for (const entity of extractResult.entities) {
    // 过滤掉数据源名称
    if (this.sourceNames.includes(entity.name)) {
      log.debug(
        { entityName: entity.name },
        "Skipping entity (source name)"
      );
      continue;
    }

    // 查找或创建实体
    let existingEntity = await db.query.entities.findFirst({
      where: eq(entities.name, entity.name),
    });

    if (existingEntity) {
      // ... 现有更新逻辑
    } else {
      // ... 现有创建逻辑
    }

    // 创建关联
    await db.insert(entityMentions).values({
      entityId: existingEntity.id,
      contentId: content.id,
      sourceId: raw.sourceId,
    });
  }
}
```

**验证**: TypeScript 编译通过

### 步骤 5: 类型检查
运行 TypeScript 编译器检查所有修改：

```bash
pnpm typecheck
```

**期望**: 无类型错误

### 步骤 6: 手动测试
1. 启动应用，触发一次采集
2. 检查数据库 entities 表，确认没有"36氪"等source名称
3. 确认其他正常实体仍被正确提取

**验证查询**:
```sql
SELECT name, mention_count, type FROM entities WHERE name IN ('36氪', 'V2EX', '少数派');
```

**期望结果**: 空结果集（或仅包含旧数据，新数据不会创建）

## 成功标准
- ✅ 所有 TypeScript 编译通过
- ✅ 数据源名称不再被提取为实体
- ✅ 其他正常实体仍能正确提取
- ✅ 代码中有适当的日志记录跳过的source名称

## 回滚计划
如果出现问题，可以回滚这些修改：
1. 恢复 `PipelineContext` 定义
2. 恢复各步骤的构造函数签名
3. 移除 prompt 中的 sourceNames 排除规则

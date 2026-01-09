# API 代码质量命令

本文档说明 API 应用的代码检查和格式化命令。

## 命令说明

### lint - 代码检查

检查代码风格和潜在问题，但不修改文件。

```bash
# 在 API 目录下运行
cd apps/api
pnpm lint

# 或使用 filter
pnpm --filter @intellipick/api lint
```

### lint:fix - 自动修复

检查代码风格并自动修复可以修复的问题。

```bash
cd apps/api
pnpm lint:fix

# 或
pnpm --filter @intellipick/api lint:fix
```

### format - 格式化代码

格式化代码以符合项目的代码风格规范。

```bash
cd apps/api
pnpm format

# 或
pnpm --filter @intellipick/api format
```

## 整个项目的代码检查

如果要对整个项目运行代码检查和格式化：

```bash
# 检查整个项目
pnpm lint

# 自动修复整个项目
pnpm lint:fix

# 格式化整个项目
pnpm format
```

## 工具说明

项目使用 **Biome** 作为代码检查和格式化工具，它提供：

- ✅ 快速的代码检查
- ✅ 自动修复功能
- ✅ 代码格式化
- ✅ Import 排序

## 当前已知问题

GraphQL resolvers 中存在 `any` 类型（现有代码，非本次引入），位于：
- `apps/api/src/graphql/resolvers.ts:50-58`

这些不影响功能运行，但建议在后续迭代中修复。

## 推荐工作流

在提交代码前运行：

```bash
# 1. 类型检查
pnpm typecheck

# 2. 代码检查和自动修复
pnpm lint:fix

# 3. 格式化代码
pnpm format
```

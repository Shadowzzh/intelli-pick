# NAS 版本化镜像部署

## 边界

- Git 工作区、测试和镜像构建均在 Mac mini 完成。
- 构建上下文由 `git archive <commit-sha>` 生成，不读取未提交文件。
- NAS 只保存 Compose、敏感环境、版本化镜像、数据卷和 release manifest。
- `/home/ziheng/intellipick` 是旧源码部署现场，不再作为构建真源。

## 前置条件

- 当前分支有 upstream，`HEAD` 已推送并与 upstream 一致。
- 除 `.agents/` 外没有未提交或未跟踪文件。
- 本机 Docker buildx 支持 NAS 平台；当前 NAS 为 `linux/amd64`。
- NAS 运行配置位于 `/home/ziheng/docker-services/configs/intellipick/`。
- NAS `.env.production` 已设置运行密钥和 `INTELLIPICK_TAG`。

## 部署

```bash
scripts/deploy-nas-images.sh
```

脚本执行以下步骤：

1. 验证干净工作区、upstream、NAS 架构和运行配置。
2. 从当前 commit 导出干净源码快照。
3. 构建 `api`、`worker`、`web`、`migrate` 四个 AMD64 镜像。
4. 镜像使用完整 commit SHA 标签和 OCI revision label。
5. 导出一个 gzip 镜像归档并生成 SHA-256。
6. 上传到 `/home/ziheng/docker-services/releases/intellipick/<commit-sha>/`。
7. NAS 校验归档、加载镜像并验证 revision label。
8. 备份 `.env.production`，更新 `INTELLIPICK_TAG`。
9. 使用 `--no-build --no-deps --force-recreate` 切换 API、Worker、Web。
10. 验证 API/Web health、Worker 注册数和容器 revision。
11. 记录本地与 NAS 镜像 ID、上一标签和部署时间。

验证失败时，脚本自动恢复上一标签并重建三个应用容器。数据库、Redis、RSSHub 和数据卷不参与应用版本切换。

## Release manifest

每个 release 保存：

- Git commit、branch、upstream 和 tree ID。
- 构建平台与时间。
- 镜像归档名称和 SHA-256。
- 本机与 NAS 的四个镜像 ID。
- 上一运行标签和正式部署时间。

manifest 不保存 `.env.production`、Push Token、数据库内容或其他密钥。

## 数据库迁移

部署脚本会交付 `intellipick-migrate:<commit-sha>`，但不会自动执行迁移。包含数据库迁移的版本应在应用切换前单独完成数据库备份，再显式运行：

```bash
ssh nas "cd /home/ziheng/docker-services/configs/intellipick && docker compose --env-file .env.production --profile tools run --rm intellipick-migrate"
```

迁移具有独立风险，不与普通应用镜像切换隐式绑定。

## 回滚

```bash
scripts/rollback-nas-images.sh <commit-sha>
```

回滚要求目标 release manifest 和四个版本化镜像仍存在。脚本备份当前环境文件、切换标签、重建应用容器并执行与部署相同的健康验证；失败时恢复回滚前标签。

## 日志与状态

```bash
ssh nas "cd /home/ziheng/docker-services/configs/intellipick && docker compose --env-file .env.production ps"
ssh nas "docker inspect intellipick-api --format '{{ index .Config.Labels \"dev.zzheng.intellipick.revision\" }}'"
ssh nas "docker logs --tail 100 intellipick-worker"
```

本机验证日志按任务保存在 `~/.codex/user-output/YYYY-MM-dd/`，不写入 Git。

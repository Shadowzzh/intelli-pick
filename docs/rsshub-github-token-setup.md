# RSSHub GitHub Token 配置指南

## 问题描述

RSSHub 的 GitHub 相关路由（如 trending、notifications 等）需要 GitHub Personal Access Token 才能正常工作。

**错误信息**:
```
Error in /github/trending/daily/any: ConfigNotFoundError: GitHub trending RSS is disabled due to the lack of relevant config
```

## 配置步骤

### 1. 创建 GitHub Personal Access Token

1. 访问 **GitHub Token 设置页面**: https://github.com/settings/tokens

2. 点击 **"Generate new token"** → **"Generate new token (classic)"**

3. 填写 Token 信息:
   - **Note (描述)**: `RSSHub GitHub Trending`
   - **Expiration (有效期)**:
     - 推荐: `90 days` 或 `No expiration`
     - 说明: 如果选择有期限，到期后需要重新生成
   - **Select scopes (权限)**:
     - ✅ **无需勾选任何权限**
     - 说明: Trending 等公开数据不需要权限，保持所有选项未选中即可

4. 点击 **"Generate token"** 按钮

5. **复制 Token**:
   - ⚠️ Token 只显示一次，请立即复制保存
   - 格式类似: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. 配置环境变量

编辑 `.env.production` 文件，替换 token 值：

```bash
# RSSHub GitHub Access Token (GitHub trending 等路由需要)
# 获取方式: https://github.com/settings/tokens (不需要勾选任何权限)
GITHUB_ACCESS_TOKEN=ghp_你的实际token值
```

**示例**:
```bash
GITHUB_ACCESS_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz123456
```

### 3. 重新创建 RSSHub 容器

配置修改后需要重新创建容器以加载新的环境变量：

```bash
# 停止并删除旧容器
docker-compose stop intellipick-rsshub
docker-compose rm -f intellipick-rsshub

# 重新创建容器
docker-compose up -d intellipick-rsshub

# 查看容器日志
docker logs -f intellipick-rsshub
```

### 4. 验证配置

#### 验证环境变量已加载

```bash
docker exec intellipick-rsshub env | grep GITHUB_ACCESS_TOKEN
```

**期望输出**:
```
GITHUB_ACCESS_TOKEN=ghp_你的token值
```

#### 测试 GitHub trending 路由

```bash
# 测试每日趋势
curl -I "http://localhost:1200/github/trending/daily/any"

# 测试 JavaScript 趋势
curl -I "http://localhost:1200/github/trending/weekly/javascript"
```

**期望输出**:
```
HTTP/1.1 200 OK
access-control-allow-methods: GET
content-type: application/xml; charset=utf-8
...
```

#### 检查 RSS 内容

```bash
# 获取完整内容
curl "http://localhost:1200/github/trending/daily/any"
```

**期望输出**: XML 格式的 RSS feed，包含 GitHub trending 仓库列表

## 支持的 GitHub 路由

配置 token 后，以下 RSSHub GitHub 路由将可用：

### 1. GitHub Trending (趋势仓库)

```
http://localhost:1200/github/trending/:since/:language/:spoken_language?
```

**参数**:
- `since`: `daily` (今天) / `weekly` (本周) / `monthly` (本月)
- `language`: 编程语言 (如 `javascript`, `python`, `go`)，不过滤用 `any`
- `spoken_language`: 自然语言 (可选，如 `en`, `zh`)

**示例**:
- 每日所有语言: `http://localhost:1200/github/trending/daily/any`
- 每周 TypeScript: `http://localhost:1200/github/trending/weekly/typescript`
- 每月 Rust (中文): `http://localhost:1200/github/trending/monthly/rust/zh`

### 2. GitHub User Repositories (用户仓库)

```
http://localhost:1200/github/repos/:user
```

**示例**: `http://localhost:1200/github/repos/facebook`

### 3. GitHub User Activity (用户动态)

```
http://localhost:1200/github/user/activity/:user
```

**示例**: `http://localhost:1200/github/user/activity/torvalds`

### 4. GitHub Notifications (个人通知)

```
http://localhost:1200/github/notifications
```

**说明**: 需要有 `notifications` 权限的 token

### 5. GitHub Issues/PRs (仓库 Issues)

```
http://localhost:1200/github/issue/:user/:repo/:state?
```

**示例**: `http://localhost:1200/github/issue/facebook/react/open`

## 故障排查

### 问题 1: 仍然显示 "ConfigNotFoundError"

**原因**: 环境变量未正确加载到容器

**解决方法**:
1. 确认 `.env.production` 中 token 值正确
2. 确认 `docker-compose.yml` 有 `env_file: - .env.production`
3. 重新创建容器（不是重启）:
   ```bash
   docker-compose up -d --force-recreate intellipick-rsshub
   ```
4. 验证环境变量:
   ```bash
   docker exec intellipick-rsshub env | grep GITHUB_ACCESS_TOKEN
   ```

### 问题 2: Token 无效或过期

**错误信息**: `401 Unauthorized` 或 `Bad credentials`

**解决方法**:
1. 访问 https://github.com/settings/tokens
2. 检查 token 状态（是否过期）
3. 如果过期，重新生成 token
4. 更新 `.env.production`
5. 重新创建容器

### 问题 3: Rate Limit (请求频率限制)

**错误信息**: `403 Forbidden` 或 `Rate limit exceeded`

**说明**:
- 无 token: 每小时 60 次请求
- 有 token: 每小时 5000 次请求

**解决方法**: 配置 token 即可大幅提升限额

### 问题 4: 路由返回 503

**可能原因**:
1. GitHub API 暂时不可用
2. 代理配置问题（无法访问 github.com）
3. RSSHub 服务启动中

**解决方法**:
1. 检查 GitHub 状态: https://www.githubstatus.com/
2. 验证代理配置:
   ```bash
   docker exec intellipick-rsshub env | grep -E "HTTP_PROXY|HTTPS_PROXY"
   ```
3. 查看 RSSHub 日志:
   ```bash
   docker logs intellipick-rsshub --tail 50
   ```

## Token 安全建议

1. **不要提交到 Git**:
   - `.env.production` 已在 `.gitignore` 中
   - 绝不要将 token 硬编码到代码中

2. **定期轮换 Token**:
   - 建议每 90 天重新生成一次
   - GitHub 会在 token 即将过期时发送邮件提醒

3. **最小权限原则**:
   - 仅在需要时勾选权限
   - Trending 等公开数据不需要任何权限

4. **泄露后立即撤销**:
   - 访问 https://github.com/settings/tokens
   - 点击 "Revoke" 撤销泄露的 token
   - 立即生成新 token 并更新配置

## 相关文件

- 环境变量配置: `.env.production`
- Docker 配置: `docker-compose.yml`
- 数据源配置: `config.sources.ts`
- RSSHub 文档: https://docs.rsshub.app/

## 参考链接

- GitHub Token 文档: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- RSSHub 配置文档: https://docs.rsshub.app/deploy/config#route-specific-configurations
- RSSHub GitHub 路由: https://docs.rsshub.app/routes/programming#github

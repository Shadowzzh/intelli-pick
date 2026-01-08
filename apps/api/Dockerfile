# ============================================
# API 应用生产环境镜像（本地编译方案）
# ============================================
# 使用前请先在项目根目录执行：pnpm build
#
# 本方案特点：
# 1. 本地编译 TypeScript，Docker 直接复制产物
# 2. Docker 构建速度快（30秒内）
# 3. 镜像体积小（~150MB）
# 4. 启动速度快（直接运行 JS）
# ============================================

FROM node:22-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9

# 从根目录复制所有 package.json 文件（monorepo 需要所有包的元信息）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/env/package.json ./packages/env/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/events/package.json ./packages/events/
COPY apps/api/package.json ./apps/api/

# 只安装生产依赖（不包含 devDependencies）
RUN pnpm install --prod --frozen-lockfile

# 复制本地编译好的产物（需要先在根目录执行 pnpm build）
# tsup 保持 workspace 包为 external 引用，所以需要复制它们的 dist
COPY packages/env/dist ./packages/env/dist
COPY packages/shared/dist ./packages/shared/dist
COPY packages/config/dist ./packages/config/dist
COPY packages/db/dist ./packages/db/dist
COPY packages/events/dist ./packages/events/dist
COPY apps/api/dist ./apps/api/dist

# 复制 workspace 包到 node_modules
RUN mkdir -p /app/apps/api/node_modules/@intellipick && \
    cp -r ./packages/env/dist/* /app/apps/api/node_modules/@intellipick/env/ && \
    cp -r ./packages/shared/dist/* /app/apps/api/node_modules/@intellipick/shared/ && \
    cp -r ./packages/config/dist/* /app/apps/api/node_modules/@intellipick/config/ && \
    cp -r ./packages/db/dist/* /app/apps/api/node_modules/@intellipick/db/ && \
    cp -r ./packages/events/dist/* /app/apps/api/node_modules/@intellipick/events/

# 复制必要的配置文件
COPY config*.ts ./

# 设置为生产环境
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# 设置工作目录为 API 应用
WORKDIR /app/apps/api

# 暴露端口
EXPOSE 3000

# 运行编译后的 JS
CMD ["node", "dist/index.js"]

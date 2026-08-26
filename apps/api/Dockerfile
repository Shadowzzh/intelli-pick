# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable pnpm \
    && corepack install --global pnpm@9.15.0

WORKDIR /app

FROM base AS manifests

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/
COPY packages/ai/package.json ./packages/ai/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/events/package.json ./packages/events/
COPY packages/shared/package.json ./packages/shared/
COPY packages/test-scripts/package.json ./packages/test-scripts/

FROM manifests AS build

RUN --mount=type=cache,id=intellipick-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @intellipick/api... build

FROM build AS migrate

WORKDIR /app/packages/db

CMD ["pnpm", "db:migrate"]

FROM manifests AS production-dependencies

RUN --mount=type=cache,id=intellipick-pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

FROM node:22-alpine AS api

ENV NODE_ENV=production
ENV LOG_LEVEL=info

WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app /app
COPY --from=build --chown=node:node /app/packages/ai/dist ./packages/ai/dist
COPY --from=build --chown=node:node /app/packages/env/dist ./packages/env/dist
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/packages/config/dist ./packages/config/dist
COPY --from=build --chown=node:node /app/packages/db/dist ./packages/db/dist
COPY --from=build --chown=node:node /app/packages/events/dist ./packages/events/dist
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/config.ts /app/config.sources.ts ./

USER node
WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]

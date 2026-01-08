# API System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dual API system (RESTful + GraphQL) for IntelliPick to expose filtered content and entities with AI-powered natural language query interface.

**Architecture:** Layered architecture with Fastify as the web framework, providing both RESTful endpoints (`/api/v1/*`) and GraphQL (`/graphql`) APIs. Shared business logic (Services) and data access (Repositories) layers underneath. Type definitions in `packages/shared` for reuse.

**Tech Stack:** Fastify, GraphQL Yoga, Drizzle ORM, Vercel AI SDK, TypeScript, PostgreSQL

---

## Task 1: Add Shared Type Definitions

**Files:**
- Create: `packages/shared/src/types/api.ts`
- Create: `packages/shared/src/types/pagination.ts`
- Create: `packages/shared/src/types/search.ts`
- Modify: `packages/shared/src/index.ts`

**Step 1: Create API response types**

Create file: `packages/shared/src/types/api.ts`

```typescript
// packages/shared/src/types/api.ts

/** 成功的 API 响应 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** 带分页的列表响应 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

/** 分页元数据 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** 错误响应 */
export interface ApiError {
  success: false;
  error: ErrorDetail;
}

/** 错误详情 */
export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/** 错误码枚举 */
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/** 联合类型：成功或失败 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** 类型守卫：判断是否成功 */
export function isSuccess<T>(result: ApiResult<T>): result is ApiResponse<T> {
  return result.success === true;
}
```

**Step 2: Create pagination types**

Create file: `packages/shared/src/types/pagination.ts`

```typescript
// packages/shared/src/types/pagination.ts

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** 解析后的分页参数 */
export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

/** 排序参数 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}
```

**Step 3: Create search types**

Create file: `packages/shared/src/types/search.ts`

```typescript
// packages/shared/src/types/search.ts

/** 搜索请求 */
export interface SearchRequest {
  query: string;
  type?: 'content' | 'entity' | 'all';
  filters?: SearchFilters;
  limit?: number;
}

/** 搜索过滤器 */
export interface SearchFilters {
  category?: string;
  tags?: string[];
  dateRange?: string;  // "7d", "30d", "90d"
  sourceId?: string;
}

/** 搜索结果 */
export interface SearchResult {
  contents: ContentSearchResult[];
  entities: EntitySearchResult[];
  meta: {
    totalContents: number;
    totalEntities: number;
    query: string;
  };
}

/** 内容搜索结果（带相关性评分） */
export interface ContentSearchResult {
  id: string;
  title: string | null;
  summary: string | null;
  rank: number;  // PostgreSQL ts_rank
}

/** 实体搜索结果 */
export interface EntitySearchResult {
  id: string;
  name: string;
  type: string;
  mentionCount: number;
}
```

**Step 4: Update shared package exports**

Modify: `packages/shared/src/index.ts`

```typescript
// packages/shared/src/index.ts

export * from "./types/raw-content.js";
export * from "./types/filter-result.js";
export * from "./types/extract-result.js";
export * from "./types/api.js";
export * from "./types/pagination.js";
export * from "./types/search.js";
```

**Step 5: Build shared package**

Run: `pnpm --filter @intellipick/shared build`

Expected: Build succeeds with no type errors

**Step 6: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add API response, pagination, and search types"
```

---

## Task 2: Setup Fastify Foundation

**Files:**
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/lib/errors.ts`
- Create: `apps/api/src/lib/validation.ts`
- Modify: `apps/api/package.json`
- Modify: `.env.example`

**Step 1: Install Fastify dependencies**

Run: `cd apps/api && pnpm add fastify @fastify/cors @fastify/rate-limit @fastify/request-id`

Expected: Packages installed successfully

**Step 2: Add API-specific environment variables**

Modify: `.env.example`

```bash
# API Configuration
API_PORT=3000
API_HOST=0.0.0.0
API_CORS_ORIGIN=*
API_RATE_LIMIT=100

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true
```

**Step 3: Create error handling utilities**

Create file: `apps/api/src/lib/errors.ts`

```typescript
// apps/api/src/lib/errors.ts
import { ErrorCode } from "@intellipick/shared";
import { FastifyError, FastifyReply } from "fastify";

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(ErrorCode.NOT_FOUND, `${resource} with id ${id} not found`);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
  }
}

export async function handleError(error: FastifyError, reply: FastifyReply) {
  if (error instanceof ApiError) {
    const statusCode = error.code === ErrorCode.NOT_FOUND ? 404 : 400;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  } else {
    reply.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    });
  }
}
```

**Step 4: Create validation utilities**

Create file: `apps/api/src/lib/validation.ts`

```typescript
// apps/api/src/lib/validation.ts
import { PaginationParams } from "@intellipick/shared";

export function parsePagination(params: PaginationParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function validateId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid ID format');
  }
}
```

**Step 5: Create Fastify app factory**

Create file: `apps/api/src/app.ts`

```typescript
// apps/api/src/app.ts
import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import requestId from '@fastify/request-id';
import { handleError } from './lib/errors.js';

export async function createApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: true,
  });

  // Request ID
  await app.register(requestId);

  // CORS
  await app.register(cors, {
    origin: process.env.API_CORS_ORIGIN === '*'
      ? true
      : process.env.API_CORS_ORIGIN?.split(','),
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: parseInt(process.env.API_RATE_LIMIT || '100'),
    timeWindow: '1 minute',
  });

  // Health check
  app.get('/health', async () => ({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  }));

  // Error handler
  app.setErrorHandler(handleError);

  // Routes will be registered here in later tasks

  return app;
}
```

**Step 6: Update main entry to use Fastify app**

Modify: `apps/api/src/index.ts`

Find the existing app initialization and replace with:

```typescript
import { createApp } from './app.js';

async function main() {
  const app = await createApp();

  const port = parseInt(process.env.API_PORT || '3000');
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen({ port, host });

  console.log(`API server listening on http://${host}:${port}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

**Step 7: Test the basic server**

Run: `cd apps/api && pnpm dev`

In another terminal: `curl http://localhost:3000/health`

Expected: `{"success":true,"data":{"status":"ok","timestamp":"..."}}`

**Step 8: Stop the dev server**

Press Ctrl+C in the terminal running the server

**Step 9: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/lib/errors.ts apps/api/src/lib/validation.ts apps/api/src/index.ts .env.example
git commit -m "feat(api): setup Fastify foundation with error handling and validation"
```

---

## Task 3: Implement Repository Layer

**Files:**
- Create: `apps/api/src/repositories/base.repository.ts`
- Create: `apps/api/src/repositories/contents.repository.ts`
- Create: `apps/api/src/repositories/entities.repository.ts`
- Create: `apps/api/src/repositories/index.ts`

**Step 1: Create base repository class**

Create file: `apps/api/src/repositories/base.repository.ts`

```typescript
// apps/api/src/repositories/base.repository.ts
import type { AnyTable, SQL } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import type { Database } from "@intellipick/db";

export abstract class BaseRepository<T extends AnyTable> {
  constructor(
    protected db: Database,
    protected table: T
  ) {}

  async findById(id: string) {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id as any, id))
      .limit(1);
    return result;
  }

  async findMany(options: {
    where?: SQL;
    limit?: number;
    offset?: number;
    orderBy?: SQL;
  }) {
    let query = this.db.select().from(this.table);

    if (options.where) {
      query = query.where(options.where);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }
    if (options.orderBy) {
      query = query.orderBy(options.orderBy);
    }

    return query;
  }

  async count(where?: SQL): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(where || sql`1=1`);
    return result.count;
  }
}
```

**Step 2: Create contents repository**

Create file: `apps/api/src/repositories/contents.repository.ts`

```typescript
// apps/api/src/repositories/contents.repository.ts
import { contents, db } from "@intellipick/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@intellipick/db";
import { BaseRepository } from "./base.repository.js";

export class ContentsRepository extends BaseRepository<typeof contents> {
  constructor(db: Database) {
    super(db, contents);
  }

  async findWithFilters(filters: {
    category?: string;
    tags?: string[];
    sourceId?: string;
    publishedAfter?: Date;
    publishedBefore?: Date;
    limit: number;
    offset: number;
    orderBy?: { column: string; direction: 'asc' | 'desc' };
  }) {
    const conditions = [];

    if (filters.category) {
      conditions.push(eq(contents.category, filters.category));
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(
        sql`${contents.tags} && ${JSON.stringify(filters.tags)}`
      );
    }

    if (filters.sourceId) {
      conditions.push(eq(contents.sourceId, filters.sourceId));
    }

    if (filters.publishedAfter) {
      conditions.push(
        sql`${contents.publishedAt} >= ${filters.publishedAfter}`
      );
    }

    if (filters.publishedBefore) {
      conditions.push(
        sql`${contents.publishedAt} <= ${filters.publishedBefore}`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBySql;
    if (filters.orderBy) {
      const column = contents[filters.orderBy.column as keyof typeof contents];
      orderBySql = filters.orderBy.direction === 'asc'
        ? asc(column as any)
        : desc(column as any);
    } else {
      orderBySql = desc(contents.publishedAt);
    }

    return this.findMany({
      where,
      limit: filters.limit,
      offset: filters.offset,
      orderBy: orderBySql,
    });
  }

  async countWithFilters(filters: {
    category?: string;
    tags?: string[];
    sourceId?: string;
    publishedAfter?: Date;
    publishedBefore?: Date;
  }): Promise<number> {
    const conditions = [];

    if (filters.category) {
      conditions.push(eq(contents.category, filters.category));
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(
        sql`${contents.tags} && ${JSON.stringify(filters.tags)}`
      );
    }

    if (filters.sourceId) {
      conditions.push(eq(contents.sourceId, filters.sourceId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return this.count(where);
  }
}
```

**Step 3: Create entities repository**

Create file: `apps/api/src/repositories/entities.repository.ts`

```typescript
// apps/api/src/repositories/entities.repository.ts
import { entities } from "@intellipick/db";
import { eq, sql } from "drizzle-orm";
import type { Database } from "@intellipick/db";
import { BaseRepository } from "./base.repository.js";

export class EntitiesRepository extends BaseRepository<typeof entities> {
  constructor(db: Database) {
    super(db, entities);
  }

  async findByType(type: string, options: { limit: number; offset: number }) {
    return this.findMany({
      where: eq(entities.type, type as any),
      limit: options.limit,
      offset: options.offset,
      orderBy: desc(entities.mentionCount),
    });
  }

  async findTrending(options: { limit: number; offset: number }) {
    return this.findMany({
      limit: options.limit,
      offset: options.offset,
      orderBy: desc(entities.mentionCount),
    });
  }

  async countByType(type: string): Promise<number> {
    return this.count(eq(entities.type, type as any));
  }
}
```

**Step 4: Create repository barrel export**

Create file: `apps/api/src/repositories/index.ts`

```typescript
// apps/api/src/repositories/index.ts
export { BaseRepository } from "./base.repository.js";
export { ContentsRepository } from "./contents.repository.js";
export { EntitiesRepository } from "./entities.repository.js";
```

**Step 5: Build to check for type errors**

Run: `cd apps/api && pnpm build`

Expected: Build succeeds with no type errors

**Step 6: Commit**

```bash
git add apps/api/src/repositories/
git commit -m "feat(api): implement repository layer for contents and entities"
```

---

## Task 4: Implement Service Layer

**Files:**
- Create: `apps/api/src/services/contents.service.ts`
- Create: `apps/api/src/services/entities.service.ts`
- Create: `apps/api/src/services/index.ts`

**Step 1: Create contents service**

Create file: `apps/api/src/services/contents.service.ts`

```typescript
// apps/api/src/services/contents.service.ts
import type { Database } from "@intellipick/db";
import type { PaginatedResponse, PaginationMeta } from "@intellipick/shared";
import { ContentsRepository } from "../repositories/contents.repository.js";

export class ContentsService {
  constructor(
    private contentsRepo: ContentsRepository,
  ) {}

  async findPaginated(params: {
    page: number;
    limit: number;
    filters?: {
      category?: string;
      tags?: string[];
      sourceId?: string;
      publishedAfter?: Date;
      publishedBefore?: Date;
    };
  }): Promise<PaginatedResponse<any>> {
    const offset = (params.page - 1) * params.limit;

    const [items, total] = await Promise.all([
      this.contentsRepo.findWithFilters({
        ...params.filters,
        limit: params.limit,
        offset,
        orderBy: { column: 'publishedAt', direction: 'desc' },
      }),
      this.contentsRepo.countWithFilters(params.filters || {}),
    ]);

    const meta: PaginationMeta = {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };

    return {
      success: true,
      data: items,
      meta,
    };
  }

  async findById(id: string) {
    const content = await this.contentsRepo.findById(id);

    if (!content) {
      return null;
    }

    return {
      success: true,
      data: content,
    };
  }
}
```

**Step 2: Create entities service**

Create file: `apps/api/src/services/entities.service.ts`

```typescript
// apps/api/src/services/entities.service.ts
import type { Database } from "@intellipick/db";
import type { PaginatedResponse, PaginationMeta } from "@intellipick/shared";
import { EntitiesRepository } from "../repositories/entities.repository.js";

export class EntitiesService {
  constructor(
    private entitiesRepo: EntitiesRepository,
  ) {}

  async findTrending(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResponse<any>> {
    const offset = (params.page - 1) * params.limit;

    const [items, totalResult] = await Promise.all([
      this.entitiesRepo.findTrending({ limit: params.limit, offset }),
      this.entitiesRepo.count(),
    ]);

    const meta: PaginationMeta = {
      total: totalResult,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(totalResult / params.limit),
    };

    return {
      success: true,
      data: items,
      meta,
    };
  }

  async findById(id: string) {
    const entity = await this.entitiesRepo.findById(id);

    if (!entity) {
      return null;
    }

    return {
      success: true,
      data: entity,
    };
  }
}
```

**Step 3: Create service barrel export**

Create file: `apps/api/src/services/index.ts`

```typescript
// apps/api/src/services/index.ts
export { ContentsService } from "./contents.service.js";
export { EntitiesService } from "./entities.service.js";
```

**Step 4: Build to check for type errors**

Run: `cd apps/api && pnpm build`

Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/api/src/services/
git commit -m "feat(api): implement service layer for contents and entities"
```

---

## Task 5: Implement RESTful API Routes

**Files:**
- Create: `apps/api/src/routes/v1/contents.routes.ts`
- Create: `apps/api/src/routes/v1/entities.routes.ts`
- Create: `apps/api/src/routes/v1/index.ts`
- Modify: `apps/api/src/app.ts`

**Step 1: Install JSON schema type provider**

Run: `cd apps/api && pnpm add @fastify/type-provider-json-schema-type`

Expected: Package installed

**Step 2: Create contents routes**

Create file: `apps/api/src/routes/v1/contents.routes.ts`

```typescript
// apps/api/src/routes/v1/contents.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors.js";
import { ContentsService } from "../../services/contents.service.js";
import { parsePagination } from "../../lib/validation.js";

export async function contentsRoutes(app: FastifyInstance, service: ContentsService) {
  const contentsQuerySchema = {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      category: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      sourceId: { type: 'string' },
    },
  } as const;

  // List contents
  app.get('/contents', {
    schema: {
      querystring: contentsQuerySchema,
    },
  }, async (req, reply) => {
    const { page, limit } = parsePagination(req.query as any);
    const filters = {
      category: (req.query as any).category,
      tags: (req.query as any).tags,
      sourceId: (req.query as any).sourceId,
    };

    const result = await service.findPaginated({ page, limit, filters });
    return reply.send(result);
  });

  // Get single content
  app.get('/contents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await service.findById(id);

    if (!result) {
      throw new NotFoundError('Content', id);
    }

    return reply.send(result);
  });
}
```

**Step 3: Create entities routes**

Create file: `apps/api/src/routes/v1/entities.routes.ts`

```typescript
// apps/api/src/routes/v1/entities.routes.ts
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors.js";
import { EntitiesService } from "../../services/entities.service.js";
import { parsePagination } from "../../lib/validation.js";

export async function entitiesRoutes(app: FastifyInstance, service: EntitiesService) {
  // List trending entities
  app.get('/entities', async (req, reply) => {
    const { page, limit } = parsePagination(req.query as any);
    const result = await service.findTrending({ page, limit });
    return reply.send(result);
  });

  // Get single entity
  app.get('/entities/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await service.findById(id);

    if (!result) {
      throw new NotFoundError('Entity', id);
    }

    return reply.send(result);
  });
}
```

**Step 4: Create routes index**

Create file: `apps/api/src/routes/v1/index.ts`

```typescript
// apps/api/src/routes/v1/index.ts
import type { FastifyInstance } from "fastify";
import { ContentsService } from "../../services/contents.service.js";
import { EntitiesService } from "../../services/entities.service.js";
import { contentsRoutes } from "./contents.routes.js";
import { entitiesRoutes } from "./entities.routes.js";

export async function registerV1Routes(
  app: FastifyInstance,
  services: { contentsService: ContentsService; entitiesService: EntitiesService }
) {
  await app.register(async (childApp: FastifyInstance) => {
    await contentsRoutes(childApp, services.contentsService);
    await entitiesRoutes(childApp, services.entitiesService);
  }, { prefix: '/api/v1' });
}
```

**Step 5: Update app.ts to register routes**

Modify: `apps/api/src/app.ts`

After the health check route, add:

```typescript
import { registerV1Routes } from './routes/v1/index.js';
import { ContentsService, EntitiesService } from './services/index.js';
import { ContentsRepository, EntitiesRepository } from './repositories/index.js';
import { db } from '@intellipick/db';

// Inside createApp(), after health check:

// Initialize repositories and services
const contentsRepo = new ContentsRepository(db);
const entitiesRepo = new EntitiesRepository(db);

const contentsService = new ContentsService(contentsRepo);
const entitiesService = new EntitiesService(entitiesRepo);

// Register routes
await registerV1Routes(app, { contentsService, entitiesService });
```

**Step 6: Test the API endpoints**

Run: `cd apps/api && pnpm dev`

Test in another terminal:

```bash
# Health check
curl http://localhost:3000/health

# List contents
curl http://localhost:3000/api/v1/contents

# Get single content (replace with real ID)
curl http://localhost:3000/api/v1/contents/test-id

# List entities
curl http://localhost:3000/api/v1/entities
```

Expected: Properly formatted JSON responses with pagination metadata

**Step 7: Stop dev server**

Press Ctrl+C

**Step 8: Commit**

```bash
git add apps/api/src/routes/
git commit -m "feat(api): implement RESTful API routes for contents and entities"
```

---

## Task 6: Implement GraphQL API

**Files:**
- Create: `apps/api/src/graphql/schema.ts`
- Create: `apps/api/src/graphql/resolvers.ts`
- Create: `apps/api/src/graphql/index.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/app.ts`

**Step 1: Install GraphQL dependencies**

Run: `cd apps/api && pnpm add graphql graphql-yoga graphql-upload`

Expected: Packages installed

**Step 2: Create GraphQL schema**

Create file: `apps/api/src/graphql/schema.ts`

```typescript
// apps/api/src/graphql/schema.ts
import { createSchema } from 'graphql-yoga';

export const typeDefs = `
  type Content {
    id: ID!
    title: String
    summary: String
    rawContent: String!
    url: String!
    author: String
    category: String
    tags: [String!]!
    keyPoints: [String!]!
    dataPoints: [String!]!
    publishedAt: String
    collectedAt: String!
    createdAt: String!
  }

  type Entity {
    id: ID!
    name: String!
    type: String!
    url: String
    description: String
    mentionCount: Int!
    metadata: JSON
    firstMentionedAt: String
    lastMentionedAt: String
  }

  type Query {
    contents(
      limit: Int = 20
      offset: Int = 0
    ): [Content!]!

    content(id: ID!): Content

    entities(
      limit: Int = 20
      offset: Int = 0
    ): [Entity!]!

    entity(id: ID!): Entity
  }

  scalar JSON
`;
```

**Step 3: Create GraphQL resolvers**

Create file: `apps/api/src/graphql/resolvers.ts`

```typescript
// apps/api/src/graphql/resolvers.ts
import { ContentsService, EntitiesService } from "../services/index.js";

export function createResolvers(
  contentsService: ContentsService,
  entitiesService: EntitiesService
) {
  return {
    Query: {
      contents: async (_: any, args: { limit: number; offset: number }) => {
        const page = Math.floor(args.offset / args.limit) + 1;
        const result = await contentsService.findPaginated({
          page,
          limit: args.limit,
        });
        return result.data;
      },

      content: async (_: any, args: { id: string }) => {
        const result = await contentsService.findById(args.id);
        return result?.data;
      },

      entities: async (_: any, args: { limit: number; offset: number }) => {
        const page = Math.floor(args.offset / args.limit) + 1;
        const result = await entitiesService.findTrending({
          page,
          limit: args.limit,
        });
        return result.data;
      },

      entity: async (_: any, args: { id: string }) => {
        const result = await entitiesService.findById(args.id);
        return result?.data;
      },
    },
  };
}
```

**Step 4: Create GraphQL server**

Create file: `apps/api/src/graphql/index.ts`

```typescript
// apps/api/src/graphql/index.ts
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import type { ContentsService, EntitiesService } from '../services/index.js';
import { typeDefs } from './schema.js';
import { createResolvers } from './resolvers.js';

export function createGraphQLServer(
  contentsService: ContentsService,
  entitiesService: EntitiesService
) {
  const resolvers = createResolvers(contentsService, entitiesService);

  const yoga = createYoga({
    schema: createSchema({
      typeDefs,
      resolvers,
    }),
    graphqlEndpoint: '/graphql',
    // Enable GraphQL Playground in development
    graphqlEndpoint: '/graphql',
    playground: process.env.GRAPHQL_PLAYGROUND === 'true',
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
  });

  return yoga;
}
```

**Step 5: Update app.ts to register GraphQL**

Modify: `apps/api/src/app.ts`

Add import:
```typescript
import { createGraphQLServer } from './graphql/index.js';
```

After registering RESTful routes, add:
```typescript
// GraphQL
const yoga = createGraphQLServer(contentsService, entitiesService);

app.route({
  url: yoga.graphqlEndpoint,
  method: ['GET', 'POST', 'OPTIONS'],
  handler: async (req, reply) => {
    const response = await yoga.handleNodeRequest(req.raw, {
      res: reply.raw,
    });
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });
    reply.status(response.status);
    reply.send(response.body);
    return reply;
  },
});
```

**Step 6: Test GraphQL endpoint**

Run: `cd apps/api && pnpm dev`

Open browser: `http://localhost:3000/graphql`

Run test query:
```graphql
query {
  contents(limit: 5) {
    id
    title
    summary
    category
  }
}
```

Expected: Returns array of contents with requested fields

**Step 7: Stop dev server**

Press Ctrl+C

**Step 8: Commit**

```bash
git add apps/api/src/graphql/
git commit -m "feat(api): implement GraphQL API with schema and resolvers"
```

---

## Task 7: Implement Search Functionality

**Files:**
- Modify: `packages/db/src/schema/contents.ts`
- Create: `apps/api/src/services/search.service.ts`
- Create: `apps/api/src/routes/v1/search.routes.ts`
- Modify: `apps/api/src/repositories/contents.repository.ts`

**Step 1: Add full-text search to contents schema**

Modify: `packages/db/src/schema/contents.ts`

Add import:
```typescript
import { pgTable, tsvector } from "drizzle-orm/pg-core";
```

Add column to table:
```typescript
searchVector: tsvector("search_vector"),
```

**Step 2: Create database migration**

Run: `pnpm db:generate`

Expected: Migration file generated

**Step 3: Run migration**

Run: `pnpm db:migrate`

Expected: Migration applied successfully

**Step 4: Create search service**

Create file: `apps/api/src/services/search.service.ts`

```typescript
// apps/api/src/services/search.service.ts
import { contents } from "@intellipick/db";
import { sql, ilike, or } from "drizzle-orm";
import type { Database } from "@intellipick/db";
import type { SearchResult, ContentSearchResult, EntitySearchResult } from "@intellipick/shared";

export class SearchService {
  constructor(private db: Database) {}

  async searchContents(query: string, limit: number = 20): Promise<ContentSearchResult[]> {
    // Simple ILIKE search for now (can be upgraded to tsvector later)
    const results = await this.db
      .select({
        id: contents.id,
        title: contents.title,
        summary: contents.summary,
      })
      .from(contents)
      .where(
        or(
          ilike(contents.title, `%${query}%`),
          ilike(contents.summary, `%${query}%`),
          ilike(contents.rawContent, `%${query}%`)
        )
      )
      .limit(limit);

    return results.map((r, i) => ({
      ...r,
      rank: limit - i, // Simple ranking
    }));
  }

  async search(query: string, limit: number = 20): Promise<SearchResult> {
    const contents = await this.searchContents(query, limit);

    return {
      contents,
      entities: [], // TODO: Implement entity search
      meta: {
        totalContents: contents.length,
        totalEntities: 0,
        query,
      },
    };
  }
}
```

**Step 5: Create search routes**

Create file: `apps/api/src/routes/v1/search.routes.ts`

```typescript
// apps/api/src/routes/v1/search.routes.ts
import type { FastifyInstance } from "fastify";
import { SearchService } from "../../services/search.service.js";

export async function searchRoutes(app: FastifyInstance, service: SearchService) {
  app.post('/search', async (req, reply) => {
    const { query, limit = 20 } = req.body as { query: string; limit?: number };

    if (!query || typeof query !== 'string') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query is required',
        },
      });
    }

    const result = await service.search(query, limit);
    return reply.send({ success: true, data: result });
  });
}
```

**Step 6: Register search routes**

Modify: `apps/api/src/routes/v1/index.ts`

```typescript
import { searchRoutes } from "./search.routes.js";

// Inside registerV1Routes(), after entities routes:
await searchRoutes(childApp, services.searchService);
```

**Step 7: Update app.ts to initialize search service**

Modify: `apps/api/src/app.ts`

```typescript
import { SearchService } from './services/search.service.js';

// After initializing other services:
const searchService = new SearchService(db);

// Update services object passed to routes:
await registerV1Routes(app, {
  contentsService,
  entitiesService,
  searchService,
});
```

**Step 8: Test search endpoint**

Run: `cd apps/api && pnpm dev`

Test:
```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query":"AI","limit":5}'
```

Expected: Returns search results with matching contents

**Step 9: Stop dev server**

Press Ctrl+C

**Step 10: Commit**

```bash
git add packages/db apps/api/src/services/search.service.ts apps/api/src/routes/v1/search.routes.ts apps/api/src/routes/v1/index.ts apps/api/src/app.ts
git commit -m "feat(api): implement full-text search functionality"
```

---

## Task 8: Implement AI Natural Language Interface

**Files:**
- Create: `apps/api/src/ai/tools.ts`
- Create: `apps/api/src/routes/v1/ai-chat.routes.ts`
- Modify: `apps/api/package.json`
- Modify: `.env.example`

**Step 1: Install AI SDK dependencies**

Run: `cd apps/api && pnpm add ai openai`

Expected: Packages installed

**Step 2: Add AI environment variables**

Modify: `.env.example`

```bash
# AI Chat Configuration
AI_CHAT_ENABLED=true
AI_CHAT_MODEL=gpt-4o-mini
```

**Step 3: Create AI tools definition**

Create file: `apps/api/src/ai/tools.ts`

```typescript
// apps/api/src/ai/tools.ts
export const aiTools = {
  queryContents: {
    description: 'Query contents with filters like category, tags, date range',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Content category' },
        tags: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number', default: 10 },
      },
    },
  },

  searchContents: {
    description: 'Full-text search across content titles, summaries, and text',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },

  getTrendingEntities: {
    description: 'Get trending entities (people, companies, products) ordered by mention count',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10 },
      },
    },
  },
};
```

**Step 4: Create AI chat route**

Create file: `apps/api/src/routes/v1/ai-chat.routes.ts`

```typescript
// apps/api/src/routes/v1/ai-chat.routes.ts
import type { FastifyInstance } from "fastify";
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ContentsService, EntitiesService, SearchService } from "../../services/index.js";
import { aiTools } from "../../ai/tools.js";

export async function aiChatRoutes(
  app: FastifyInstance,
  services: {
    contentsService: ContentsService;
    entitiesService: EntitiesService;
    searchService: SearchService;
  }
) {
  app.post('/ai/chat', async (req, reply) => {
    const { message } = req.body as { message: string };

    if (!message) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is required' },
      });
    }

    try {
      const result = await generateText({
        model: openai(process.env.AI_CHAT_MODEL || 'gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for querying content from IntelliPick. Use the available tools to search and retrieve information.',
          },
          { role: 'user', content: message },
        ],
        tools: aiTools,
        maxToolRoundtrips: 2,
      });

      // Execute tool calls
      if (result.toolCalls && result.toolCalls.length > 0) {
        const toolResults: any[] = [];

        for (const toolCall of result.toolCalls) {
          let data;

          switch (toolCall.toolName) {
            case 'queryContents':
              const contentsResult = await services.contentsService.findPaginated({
                page: 1,
                limit: toolCall.args.limit || 10,
                filters: toolCall.args,
              });
              data = contentsResult.data;
              break;

            case 'searchContents':
              const searchResult = await services.searchService.searchContents(
                toolCall.args.query,
                toolCall.args.limit || 10
              );
              data = searchResult;
              break;

            case 'getTrendingEntities':
              const entitiesResult = await services.entitiesService.findTrending({
                page: 1,
                limit: toolCall.args.limit || 10,
              });
              data = entitiesResult.data;
              break;
          }

          toolResults.push({ tool: toolCall.toolName, data });
        }

        // Generate natural language response
        const followUp = await generateText({
          model: openai(process.env.AI_CHAT_MODEL || 'gpt-4o-mini'),
          messages: [
            {
              role: 'system',
              content: 'Summarize the search results in a friendly, concise way. Use Chinese.',
            },
            { role: 'user', content: message },
            {
              role: 'assistant',
              content: `Tool results: ${JSON.stringify(toolResults, null, 2)}`,
            },
          ],
        });

        return reply.send({
          success: true,
          data: {
            response: followUp.text,
            toolResults,
          },
        });
      }

      // No tool calls, just return the text
      return reply.send({
        success: true,
        data: { response: result.text },
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'AI processing failed',
        },
      });
    }
  });
}
```

**Step 5: Register AI chat route**

Modify: `apps/api/src/routes/v1/index.ts`

```typescript
import { aiChatRoutes } from "./ai-chat.routes.js";

// Inside registerV1Routes():
await aiChatRoutes(childApp, services);
```

**Step 6: Test AI chat**

Run: `cd apps/api && pnpm dev`

Test:
```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"最近最热门的内容有哪些？"}'
```

Expected: AI responds with trending contents in natural language

**Step 7: Stop dev server**

Press Ctrl+C

**Step 8: Commit**

```bash
git add apps/api/src/ai/ apps/api/src/routes/v1/ai-chat.routes.ts apps/api/src/routes/v1/index.ts .env.example
git commit -m "feat(api): implement AI natural language chat interface"
```

---

## Task 9: Add Testing

**Files:**
- Create: `apps/api/src/__tests__/contents.test.ts`
- Create: `apps/api/src/__tests__/entities.test.ts`
- Create: `apps/api/src/__tests__/search.test.ts`
- Modify: `apps/api/package.json`

**Step 1: Install test dependencies**

Run: `cd apps/api && pnpm add -D vitest @vitest/coverage-v8`

Expected: Packages installed

**Step 2: Add test script to package.json**

Modify: `apps/api/package.json`

Add to scripts:
```json
"test": "vitest",
"test:coverage": "vitest --coverage"
```

**Step 3: Create vitest config**

Create file: `apps/api/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

**Step 4: Create contents API test**

Create file: `apps/api/src/__tests__/contents.test.ts`

```typescript
// apps/api/src/__tests__/contents.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

describe('Contents API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('GET /api/v1/contents returns paginated contents', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/contents?page=1&limit=20',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('page');
    expect(body.meta).toHaveProperty('limit');
    expect(body.meta).toHaveProperty('totalPages');
  });

  it('GET /api/v1/contents/:id returns 404 for non-existent content', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/contents/non-existent-id',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
```

**Step 5: Create entities API test**

Create file: `apps/api/src/__tests__/entities.test.ts`

```typescript
// apps/api/src/__tests__/entities.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

describe('Entities API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/entities returns paginated entities', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/entities?page=1&limit=20',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty('total');
  });

  it('GET /api/v1/entities/:id returns 404 for non-existent entity', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/entities/non-existent-id',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });
});
```

**Step 6: Create search API test**

Create file: `apps/api/src/__tests__/search.test.ts`

```typescript
// apps/api/src/__tests__/search.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

describe('Search API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/search returns search results', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/search',
      payload: {
        query: 'AI',
        limit: 10,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('contents');
    expect(body.data).toHaveProperty('meta');
  });

  it('POST /api/v1/search returns validation error without query', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/search',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

**Step 7: Run tests**

Run: `cd apps/api && pnpm test`

Expected: All tests pass

**Step 8: Commit**

```bash
git add apps/api/src/__tests__/ apps/api/vitest.config.ts apps/api/package.json
git commit -m "test(api): add API integration tests"
```

---

## Task 10: Documentation and Final Polish

**Files:**
- Create: `docs/api.md`
- Create: `docs/api-examples.md`
- Modify: `README.md`

**Step 1: Create API documentation**

Create file: `docs/api.md`

```markdown
# IntelliPick API Documentation

## Overview

IntelliPick provides dual API interfaces:
- **RESTful API** at `/api/v1/*` - Simple HTTP endpoints with JSON responses
- **GraphQL API** at `/graphql` - Flexible querying with GraphQL
- **AI Chat** at `/api/v1/ai/chat` - Natural language interface

## Base URL

Development: `http://localhost:3000`

## Authentication

Currently no authentication required (public API).

## RESTful API

### Contents

#### List Contents
\`\`\`http
GET /api/v1/contents?page=1&limit=20&category=技术
\`\`\`

#### Get Content by ID
\`\`\`http
GET /api/v1/contents/:id
\`\`\`

### Entities

#### List Trending Entities
\`\`\`http
GET /api/v1/entities?page=1&limit=20
\`\`\`

#### Get Entity by ID
\`\`\`http
GET /api/v1/entities/:id
\`\`\`

### Search

#### Full-text Search
\`\`\`http
POST /api/v1/search
Content-Type: application/json

{
  "query": "AI",
  "limit": 20
}
\`\`\`

## GraphQL API

Endpoint: `POST /graphql`

### Example Query
\`\`\`graphql
query {
  contents(limit: 10) {
    id
    title
    summary
    category
    tags
  }
}
\`\`\`

Interactive playground available at `http://localhost:3000/graphql` in development.

## AI Chat

Natural language interface for querying content.

\`\`\`http
POST /api/v1/ai/chat
Content-Type: application/json

{
  "message": "最近关于AI的热门文章有哪些？"
}
\`\`\`

## Response Format

### Success Response
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Content not found"
  }
}
\`\`\`
```

**Step 2: Create API examples**

Create file: `docs/api-examples.md`

```markdown
# API Usage Examples

## RESTful API Examples

### Using curl

\`\`\`bash
# Get latest contents
curl http://localhost:3000/api/v1/contents

# Get contents with filters
curl "http://localhost:3000/api/v1/contents?category=技术&tags=AI&limit=10"

# Search
curl -X POST http://localhost:3000/api/v1/search \\
  -H "Content-Type: application/json" \\
  -d '{"query":"机器学习","limit":5}'
\`\`\`

### Using JavaScript (fetch)

\`\`\`javascript
// Get contents
const response = await fetch('http://localhost:3000/api/v1/contents?page=1&limit=20');
const result = await response.json();
console.log(result.data);

// Search
const searchResponse = await fetch('http://localhost:3000/api/v1/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'AI', limit: 10 }),
});
const searchResult = await searchResponse.json();
console.log(searchResult.data.contents);
\`\`\`

### Using Python (requests)

\`\`\`python
import requests

# Get contents
response = requests.get('http://localhost:3000/api/v1/contents', params={
    'page': 1,
    'limit': 20,
    'category': '技术'
})
result = response.json()
print(result['data'])

# Search
search_response = requests.post('http://localhost:3000/api/v1/search', json={
    'query': 'AI',
    'limit': 10
})
search_result = search_response.json()
print(search_result['data']['contents'])
\`\`\`

## GraphQL Examples

### Basic Query

\`\`\`bash
curl -X POST http://localhost:3000/graphql \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { contents(limit: 5) { id title summary category } }"
  }'
\`\`\`

### Using JavaScript

\`\`\`javascript
const response = await fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      query {
        contents(limit: 10) {
          id
          title
          summary
          category
          tags
        }
      }
    `
  }),
});
const result = await response.json();
console.log(result.data.contents);
\`\`\`

## AI Chat Examples

\`\`\`bash
# Ask in natural language
curl -X POST http://localhost:3000/api/v1/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "最近一周最火的技术文章有哪些？"}'
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "response": "找到了5篇最近一周的热门技术文章：...",
    "toolResults": [...]
  }
}
\`\`\`
```

**Step 3: Update main README**

Modify: `README.md`

Add API section after architecture overview:

\`\`\`markdown
## API

IntelliPick provides dual API interfaces for external access:

- **RESTful API** - Standard HTTP endpoints with JSON responses
- **GraphQL API** - Flexible querying with strong typing
- **AI Chat** - Natural language interface powered by OpenAI

See [docs/api.md](docs/api.md) for detailed documentation and [docs/api-examples.md](docs/api-examples.md) for usage examples.

### Quick Start

\`\`\`bash
# Start the API server
cd apps/api && pnpm dev

# Try the health check
curl http://localhost:3000/health

# Get latest contents
curl http://localhost:3000/api/v1/contents

# Open GraphQL playground
open http://localhost:3000/graphql
\`\`\`
\`\`\`

**Step 4: Build entire project**

Run: `pnpm build`

Expected: All packages build successfully

**Step 5: Type check**

Run: `pnpm typecheck`

Expected: No type errors

**Step 6: Commit**

```bash
git add docs/ README.md
git commit -m "docs(api): add API documentation and usage examples"
```

---

## Final Verification

**Step 1: Start all services**

Run: `docker-compose up -d`

Expected: PostgreSQL and Redis running

**Step 2: Run migrations**

Run: `pnpm db:migrate`

Expected: Migrations applied

**Step 3: Start API server**

Run: `cd apps/api && pnpm dev`

**Step 4: Test all endpoints**

\`\`\`bash
# Health check
curl http://localhost:3000/health

# RESTful API
curl http://localhost:3000/api/v1/contents
curl http://localhost:3000/api/v1/entities
curl -X POST http://localhost:3000/api/v1/search -H "Content-Type: application/json" -d '{"query":"AI"}'

# GraphQL (in browser)
open http://localhost:3000/graphql

# AI Chat
curl -X POST http://localhost:3000/api/v1/ai/chat -H "Content-Type: application/json" -d '{"message":"最近有什么热门内容？"}'
\`\`\`

Expected: All endpoints return proper responses

**Step 5: Run tests**

Run: `cd apps/api && pnpm test`

Expected: All tests pass

**Step 6: Final commit**

```bash
git add .
git commit -m "feat(api): complete API system implementation

- RESTful API with pagination and filtering
- GraphQL API with flexible querying
- Full-text search functionality
- AI natural language interface
- Comprehensive test coverage
- Full documentation"
```

**Step 7: Push to remote**

Run: `git push origin master`

---

## Summary

This implementation plan builds a complete dual API system (RESTful + GraphQL) with:

✅ Layered architecture (Routes → Services → Repositories)
✅ Type-safe with TypeScript and shared types
✅ RESTful API with pagination and filtering
✅ GraphQL API with flexible querying
✅ Full-text search functionality
✅ AI-powered natural language interface
✅ Comprehensive error handling
✅ Integration tests
✅ Full documentation

All tasks follow TDD principles with frequent commits and incremental development.

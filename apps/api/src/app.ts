import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Config } from "@intellipick/config";
import { db } from "@intellipick/db";
// apps/api/src/app.ts
import fastify, { type FastifyInstance } from "fastify";
import mercurius from "mercurius";
import { createGraphQLServer } from "./graphql/index.js";
import { handleError } from "./lib/errors.js";
import {
	ContentsRepository,
	EntitiesRepository,
	SourcesRepository,
} from "./repositories/index.js";
import { registerV1Routes } from "./routes/v1/index.js";
import {
	ContentsService,
	EntitiesService,
	QueueService,
	SearchService,
	SourcesService,
	StatsService,
} from "./services/index.js";

export async function createApp(config?: Config): Promise<FastifyInstance> {
	const app = fastify({
		logger: true,
	});

	// CORS (从配置文件读取)
	const corsOrigin = config?.api?.corsOrigin || "*";
	await app.register(cors, {
		origin: corsOrigin === "*" ? true : corsOrigin,
	});

	// Rate limiting (从配置文件读取)
	const rateLimitMax = config?.api?.rateLimit || 100;
	await app.register(rateLimit, {
		max: rateLimitMax,
		timeWindow: "1 minute",
	});

	// Health check
	app.get("/health", async () => ({
		success: true,
		data: { status: "ok", timestamp: new Date().toISOString() },
	}));

	// Error handler
	app.setErrorHandler(handleError);

	// Initialize repositories and services
	const contentsRepo = new ContentsRepository(db);
	const entitiesRepo = new EntitiesRepository(db);
	const sourcesRepo = new SourcesRepository(db);

	const contentsService = new ContentsService(contentsRepo);
	const entitiesService = new EntitiesService(entitiesRepo);
	const sourcesService = new SourcesService(sourcesRepo);
	const searchService = new SearchService(db);
	const statsService = new StatsService();

	// Initialize queue service (optional, depends on REDIS_URL)
	const queueService = process.env.REDIS_URL
		? new QueueService(process.env.REDIS_URL)
		: null;

	// Register RESTful routes
	await registerV1Routes(app, {
		contentsService,
		entitiesService,
		searchService,
		sourcesService,
		statsService,
		queueService: queueService ?? undefined,
		config,
	});

	// GraphQL
	const graphqlConfig = createGraphQLServer(
		contentsService,
		entitiesService,
		sourcesService,
	);

	// 注册 Mercurius GraphQL 插件
	// 类型断言: Mercurius 的类型系统不支持直接扩展上下文类型
	// 我们的 AppContext 扩展了 MercuriusContext，添加了自定义服务
	await app.register(mercurius, {
		schema: graphqlConfig.typeDefs,
		resolvers: graphqlConfig.resolvers as any,
		context: graphqlConfig.context as any,
		graphiql: true, // 开发模式下启用 GraphiQL IDE
		path: "/graphql",
	});

	// 允许 GraphQL playground 的 CORS
	if (process.env.NODE_ENV !== "production") {
		console.log("🔍 GraphQL Playground: http://localhost:3001/graphql");
	}

	return app;
}

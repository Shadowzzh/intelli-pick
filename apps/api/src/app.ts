import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import mercurius from "mercurius";
import type { Config } from "@intellipick/config";
import { db } from "@intellipick/db";
// apps/api/src/app.ts
import fastify, { type FastifyInstance } from "fastify";
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

	// Register RESTful routes
	await registerV1Routes(app, {
		contentsService,
		entitiesService,
		searchService,
		statsService,
		config,
	});

	// GraphQL
	const graphqlConfig = createGraphQLServer(
		contentsService,
		entitiesService,
		sourcesService,
	);

	// 注册 Mercurius GraphQL 插件
	await app.register(mercurius, {
		schema: graphqlConfig.typeDefs,
		resolvers: graphqlConfig.resolvers,
		context: graphqlConfig.context,
		graphiql: true, // 开发模式下启用 GraphiQL IDE
		path: "/graphql",
	});

	// 允许 GraphQL playground 的 CORS
	if (process.env.NODE_ENV !== "production") {
		console.log("🔍 GraphQL Playground: http://localhost:3001/graphql");
	}

	return app;
}

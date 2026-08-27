import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { createAiClient } from "@intellipick/ai";
import type { Config } from "@intellipick/config";
import { db } from "@intellipick/db";
// apps/api/src/app.ts
import fastify, { type FastifyInstance } from "fastify";
import { NoSchemaIntrospectionCustomRule } from "graphql";
import mercurius from "mercurius";
import { createGraphQLServer } from "./graphql/index";
import {
	ApiMetricsCollector,
	registerApiMetricsHooks,
} from "./lib/api-metrics";
import type { AuthService } from "./lib/auth";
import { readAuthSession } from "./lib/auth";
import { UnauthorizedError, handleError } from "./lib/errors";
import {
	ContentsRepository,
	EntitiesRepository,
	JobHistoryRepository,
	JobsRepository,
	SourcesRepository,
} from "./repositories/index";
import { registerV1Routes } from "./routes/v1/index";
import {
	ContentsService,
	EntitiesService,
	JobHistoryService,
	JobsService,
	MonitoringService,
	QueueService,
	SearchService,
	SourcesService,
	StatsService,
} from "./services/index";

export async function createApp(
	config?: Config,
	auth?: AuthService,
): Promise<FastifyInstance> {
	const app = fastify({
		logger: true,
		trustProxy: true,
	});
	const apiMetrics = new ApiMetricsCollector();
	registerApiMetricsHooks(app, apiMetrics);

	// CORS (从配置文件读取)
	const corsOrigin = config?.api?.corsOrigin || "*";
	await app.register(cors, {
		origin: corsOrigin === "*" ? true : corsOrigin,
		credentials: true,
	});

	// Rate limiting (从配置文件读取)
	const rateLimitMax = config?.api?.rateLimit || 100;
	await app.register(rateLimit, {
		max: rateLimitMax,
		timeWindow: "1 minute",
	});

	if (auth) {
		await app.register(cookie, {
			secret: auth.config.sessionSecret,
			hook: "onRequest",
		});
	}

	// Error handler
	app.setErrorHandler(handleError);

	if (auth) {
		app.addHook("onRequest", async (request) => {
			const path = (request.raw.url || request.url).split("?", 1)[0];
			const isPublicAuthRoute =
				path === "/api/v1/auth/login" || path === "/api/v1/auth/logout";
			const isProtectedRoute = path === "/graphql" || path.startsWith("/api/");

			if (!isProtectedRoute || isPublicAuthRoute) {
				return;
			}

			if (!readAuthSession(request, auth)) {
				throw new UnauthorizedError();
			}
		});
	}

	// Health check
	app.get("/health", async () => ({
		success: true,
		data: { status: "ok", timestamp: new Date().toISOString() },
	}));

	// Initialize repositories and services
	const contentsRepo = new ContentsRepository(db);
	const entitiesRepo = new EntitiesRepository(db);
	const sourcesRepo = new SourcesRepository(db);
	const jobHistoryRepo = new JobHistoryRepository(db);
	const jobsRepo = new JobsRepository(db);

	const contentsService = new ContentsService(contentsRepo);
	const entitiesService = new EntitiesService(entitiesRepo);
	const sourcesService = new SourcesService(sourcesRepo);
	const searchService = new SearchService(db);
	const statsService = new StatsService();
	const jobHistoryService = new JobHistoryService(jobHistoryRepo);
	const jobsService = new JobsService(jobsRepo);
	const ai = config ? createAiClient(config.ai) : undefined;

	// Initialize queue service (optional, depends on REDIS_URL)
	const queueService = process.env.REDIS_URL
		? new QueueService(process.env.REDIS_URL, config?.queue.name)
		: null;

	// Initialize monitoring service
	const monitoringService = new MonitoringService(
		statsService,
		queueService,
		sourcesService,
		contentsService,
		entitiesService,
		jobHistoryService,
		apiMetrics,
		config?.ai,
	);

	// Register RESTful routes
	await registerV1Routes(app, {
		contentsService,
		entitiesService,
		searchService,
		sourcesService,
		statsService,
		monitoringService,
		queueService: queueService ?? undefined,
		jobHistoryService,
		jobsService,
		ai,
		auth,
	});

	// GraphQL
	const graphqlConfig = createGraphQLServer(
		contentsService,
		entitiesService,
		sourcesService,
	);
	const graphqlPlayground = config?.api?.graphql.playground ?? false;
	const graphqlIntrospection = config?.api?.graphql.introspection ?? true;
	const validationRules = graphqlIntrospection
		? []
		: [NoSchemaIntrospectionCustomRule];

	// 注册 Mercurius GraphQL 插件
	// 我们通过 declare module 扩展了 MercuriusContext，添加了自定义服务
	await app.register(mercurius, {
		schema: graphqlConfig.typeDefs,
		resolvers: graphqlConfig.resolvers,
		context: graphqlConfig.context,
		graphiql: graphqlPlayground,
		validationRules,
		path: "/graphql",
	});

	if (graphqlPlayground) {
		console.log("GraphQL Playground enabled at /graphql");
	}

	return app;
}

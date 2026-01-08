// apps/api/src/app.ts
import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { handleError } from "./lib/errors.js";
import { registerV1Routes } from "./routes/v1/index.js";
import {
	ContentsService,
	EntitiesService,
	SearchService,
} from "./services/index.js";
import { ContentsRepository, EntitiesRepository } from "./repositories/index.js";
import { createGraphQLServer } from "./graphql/index.js";
import { db } from "@intellipick/db";

export async function createApp(): Promise<FastifyInstance> {
	const app = fastify({
		logger: true,
	});

	// CORS
	await app.register(cors, {
		origin:
			process.env.API_CORS_ORIGIN === "*"
				? true
				: process.env.API_CORS_ORIGIN
					? process.env.API_CORS_ORIGIN.split(",")
					: true, // Default to true if not set (for tests)
	});

	// Rate limiting
	await app.register(rateLimit, {
		max: Number.parseInt(process.env.API_RATE_LIMIT || "100"),
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

	const contentsService = new ContentsService(contentsRepo);
	const entitiesService = new EntitiesService(entitiesRepo);
	const searchService = new SearchService(db);

	// Register RESTful routes
	await registerV1Routes(app, {
		contentsService,
		entitiesService,
		searchService,
	});

	// GraphQL
	const yoga = createGraphQLServer(contentsService, entitiesService);

	app.route({
		url: yoga.graphqlEndpoint,
		method: ["GET", "POST", "OPTIONS"],
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

	return app;
}

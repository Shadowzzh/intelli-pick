// apps/api/src/app.ts
import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { handleError } from "./lib/errors.js";

export async function createApp(): Promise<FastifyInstance> {
	const app = fastify({
		logger: true,
	});

	// CORS
	await app.register(cors, {
		origin:
			process.env.API_CORS_ORIGIN === "*"
				? true
				: process.env.API_CORS_ORIGIN?.split(","),
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

	// Routes will be registered here in later tasks

	return app;
}

// apps/api/src/routes/v1/index.ts
import type { FastifyInstance } from "fastify";
import { ContentsService } from "../../services/contents.service.js";
import { EntitiesService } from "../../services/entities.service.js";
import { contentsRoutes } from "./contents.routes.js";
import { entitiesRoutes } from "./entities.routes.js";

export async function registerV1Routes(
	app: FastifyInstance,
	services: {
		contentsService: ContentsService;
		entitiesService: EntitiesService;
	},
) {
	await app.register(async (childApp: FastifyInstance) => {
		await contentsRoutes(childApp, services.contentsService);
		await entitiesRoutes(childApp, services.entitiesService);
	}, { prefix: "/api/v1" });
}

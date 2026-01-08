// apps/api/src/routes/v1/index.ts
import type { FastifyInstance } from "fastify";
import { ContentsService } from "../../services/contents.service.js";
import { EntitiesService } from "../../services/entities.service.js";
import { SearchService } from "../../services/search.service.js";
import { contentsRoutes } from "./contents.routes.js";
import { entitiesRoutes } from "./entities.routes.js";
import { searchRoutes } from "./search.routes.js";
import { aiChatRoutes } from "./ai-chat.routes.js";

export async function registerV1Routes(
	app: FastifyInstance,
	services: {
		contentsService: ContentsService;
		entitiesService: EntitiesService;
		searchService: SearchService;
	},
) {
	await app.register(async (childApp: FastifyInstance) => {
		await contentsRoutes(childApp, services.contentsService);
		await entitiesRoutes(childApp, services.entitiesService);
		await searchRoutes(childApp, services.searchService);
		await aiChatRoutes(childApp, services);
	}, { prefix: "/api/v1" });
}

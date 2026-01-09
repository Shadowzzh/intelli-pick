// apps/api/src/routes/v1/index.ts
import type { Config } from "@intellipick/config";
import type { FastifyInstance } from "fastify";
import type { ContentsService } from "../../services/contents.service.js";
import type { EntitiesService } from "../../services/entities.service.js";
import type { QueueService } from "../../services/queue.service.js";
import type { SearchService } from "../../services/search.service.js";
import type { SourcesService } from "../../services/sources.service.js";
import type { StatsService } from "../../services/stats.service.js";
import { aiChatRoutes } from "./ai-chat.routes.js";
import { contentsRoutes } from "./contents.routes.js";
import { entitiesRoutes } from "./entities.routes.js";
import { queueRoutes } from "./queue.routes.js";
import { searchRoutes } from "./search.routes.js";
import { sourcesRoutes } from "./sources.routes.js";
import { statsRoutes } from "./stats.routes.js";

export async function registerV1Routes(
	app: FastifyInstance,
	services: {
		contentsService: ContentsService;
		entitiesService: EntitiesService;
		queueService?: QueueService;
		searchService: SearchService;
		sourcesService: SourcesService;
		statsService: StatsService;
		config?: Config;
	},
) {
	await app.register(
		async (childApp: FastifyInstance) => {
			await contentsRoutes(childApp, services.contentsService);
			await entitiesRoutes(childApp, services.entitiesService);
			await searchRoutes(childApp, services.searchService);
			await sourcesRoutes(childApp, services.sourcesService);
			await statsRoutes(childApp, services.statsService);
			if (services.queueService) {
				await queueRoutes(childApp, services.queueService);
			}
			await aiChatRoutes(childApp, services, services.config);
		},
		{ prefix: "/api/v1" },
	);
}

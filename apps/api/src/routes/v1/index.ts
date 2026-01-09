// apps/api/src/routes/v1/index.ts
import type { Config } from "@intellipick/config";
import type { FastifyInstance } from "fastify";
import type { ContentsService } from "../../services/contents.service";
import type { EntitiesService } from "../../services/entities.service";
import type { QueueService } from "../../services/queue.service";
import type { SearchService } from "../../services/search.service";
import type { SourcesService } from "../../services/sources.service";
import type { StatsService } from "../../services/stats.service";
import { aiChatRoutes } from "./ai-chat.routes";
import { contentsRoutes } from "./contents.routes";
import { entitiesRoutes } from "./entities.routes";
import { queueRoutes } from "./queue.routes";
import { searchRoutes } from "./search.routes";
import { sourcesRoutes } from "./sources.routes";
import { statsRoutes } from "./stats.routes";

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

// apps/api/src/routes/v1/index.ts
import type { AiClient } from "@intellipick/ai";
import type { FastifyInstance } from "fastify";
import type { AuthService } from "../../lib/auth";
import type { ContentsService } from "../../services/contents.service";
import type { EntitiesService } from "../../services/entities.service";
import type { JobHistoryService } from "../../services/job-history.service";
import type { JobsService } from "../../services/jobs.service";
import type { MonitoringService } from "../../services/monitoring.service";
import type { QueueService } from "../../services/queue.service";
import type { SearchService } from "../../services/search.service";
import type { SourcesService } from "../../services/sources.service";
import type { StatsService } from "../../services/stats.service";
import { aiChatRoutes } from "./ai-chat.routes";
import { authRoutes } from "./auth.routes";
import { contentsRoutes } from "./contents.routes";
import { entitiesRoutes } from "./entities.routes";
import { jobHistoryRoutes } from "./job-history.routes";
import { jobsRoutes } from "./jobs.routes";
import { monitoringRoutes } from "./monitoring.routes";
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
		jobHistoryService?: JobHistoryService;
		jobsService: JobsService;
		searchService: SearchService;
		sourcesService: SourcesService;
		statsService: StatsService;
		monitoringService: MonitoringService;
		ai?: AiClient;
		auth?: AuthService;
	},
) {
	await app.register(
		async (childApp: FastifyInstance) => {
			if (services.auth) {
				await authRoutes(childApp, services.auth);
			}
			await contentsRoutes(childApp, services.contentsService);
			await entitiesRoutes(childApp, services.entitiesService);
			await searchRoutes(childApp, services.searchService);
			await sourcesRoutes(childApp, services.sourcesService);
			await statsRoutes(childApp, services.statsService);
			await monitoringRoutes(childApp, services.monitoringService);
			if (services.queueService) {
				await queueRoutes(childApp, services.queueService);
			}
			if (services.jobHistoryService) {
				await jobHistoryRoutes(childApp, services.jobHistoryService);
			}
			await jobsRoutes(childApp, services.jobsService);
			await aiChatRoutes(childApp, services, services.ai);
		},
		{ prefix: "/api/v1" },
	);
}

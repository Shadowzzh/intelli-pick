// apps/api/src/routes/v1/queue.routes.ts
import type { FastifyInstance } from "fastify";
import type { QueueService } from "../../services/queue.service";

export async function queueRoutes(app: FastifyInstance, service: QueueService) {
	// Get queue statistics
	app.get("/queue/stats", async (req) => {
		const result = await service.getStats();
		return result;
	});
}

// apps/api/src/routes/v1/queue.routes.ts
import type { FastifyInstance } from "fastify";
import type { QueueService } from "../../services/queue.service";

export async function queueRoutes(app: FastifyInstance, service: QueueService) {
	// Get queue statistics
	app.get("/queue/stats", async (req) => {
		const result = await service.getStats();
		return result;
	});

	// Get jobs list by status
	app.get<{
		Querystring: {
			status: "all" | "waiting" | "active" | "completed" | "failed" | "delayed";
			start?: string;
			end?: string;
		};
	}>(
		"/queue/jobs",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["status"],
					properties: {
						status: {
							type: "string",
							enum: [
								"all",
								"waiting",
								"active",
								"completed",
								"failed",
								"delayed",
							],
						},
						start: { type: "string" },
						end: { type: "string" },
					},
				},
			},
		},
		async (req) => {
			const { status, start = "0", end = "9" } = req.query;
			const result = await service.getJobs(
				status,
				Number.parseInt(start),
				Number.parseInt(end),
			);
			return result;
		},
	);

	// Get single job details
	app.get<{
		Params: { jobId: string };
	}>("/queue/jobs/:jobId", async (req) => {
		const { jobId } = req.params;
		const result = await service.getJob(jobId);
		return result;
	});

	// Get processing rate statistics
	app.get("/queue/processing-rate", async (req) => {
		const result = await service.getProcessingRate();
		return result;
	});
}

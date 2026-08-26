import fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleError } from "../lib/errors";
import { jobHistoryRoutes } from "../routes/v1/job-history.routes";
import { queueRoutes } from "../routes/v1/queue.routes";
import type { JobHistoryService } from "../services/job-history.service";
import type { QueueService } from "../services/queue.service";

describe("Task detail routes", () => {
	let app: FastifyInstance;
	const queueService = {
		getStats: vi.fn(),
		getJobs: vi.fn(),
		getJob: vi.fn(),
		getProcessingRate: vi.fn(),
	};
	const historyService = {
		findPaginated: vi.fn(),
		getStats: vi.fn(),
		findByJobId: vi.fn(),
		findById: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();
		queueService.getStats.mockResolvedValue({ success: true, data: {} });
		queueService.getJobs.mockResolvedValue({ success: true, data: [] });
		queueService.getProcessingRate.mockResolvedValue({
			success: true,
			data: {},
		});
		historyService.findPaginated.mockResolvedValue({
			success: true,
			data: [],
			meta: { total: "0", page: 1, limit: 20, totalPages: 0 },
		});
		historyService.getStats.mockResolvedValue({ success: true, data: {} });

		app = fastify();
		app.setErrorHandler(handleError);
		await queueRoutes(app, queueService as unknown as QueueService);
		await jobHistoryRoutes(app, historyService as unknown as JobHistoryService);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	it("returns a standard 404 when a live queue job is gone", async () => {
		queueService.getJob.mockResolvedValue({
			success: false,
			error: "Job not found",
		});

		const response = await app.inject({
			method: "GET",
			url: "/queue/jobs/missing-job",
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("NOT_FOUND");
	});

	it("returns a standard 404 when persistent history is absent", async () => {
		historyService.findByJobId.mockResolvedValue({
			success: false,
			error: "Job history not found",
		});

		const response = await app.inject({
			method: "GET",
			url: "/job-history/job/missing-job",
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("NOT_FOUND");
	});
});

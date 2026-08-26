import fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleError } from "../lib/errors";
import { jobsRoutes } from "../routes/v1/jobs.routes";
import type { JobsService } from "../services/jobs.service";

describe("Jobs routes", () => {
	let app: FastifyInstance;
	const service = {
		findPaginated: vi.fn(),
		findSources: vi.fn(),
		findFacets: vi.fn(),
		findById: vi.fn(),
		updateTracking: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();
		service.findPaginated.mockResolvedValue({
			success: true,
			data: [],
			meta: { total: "0", page: 1, limit: 20, totalPages: 0 },
		});
		service.findSources.mockResolvedValue({ success: true, data: [] });
		service.findFacets.mockResolvedValue({
			success: true,
			data: { roleCategories: [], skills: [] },
		});
		service.findById.mockResolvedValue({
			success: true,
			data: { id: "job-1" },
		});
		service.updateTracking.mockResolvedValue({
			success: true,
			data: { postingId: "job-1", status: "applied" },
		});

		app = fastify();
		app.setErrorHandler(handleError);
		await jobsRoutes(app, service as unknown as JobsService);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	it("passes pagination and filters to the service", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/jobs?page=2&limit=20&search=React&remoteType=remote&trackingStatus=applied&favorite=true&roleCategory=后端开发&skill=Java&sortOrder=asc",
		});

		expect(response.statusCode).toBe(200);
		expect(service.findPaginated).toHaveBeenCalledWith({
			page: 2,
			limit: 20,
			filters: {
				search: "React",
				sourceId: undefined,
				remoteType: "remote",
				trackingStatus: "applied",
				favorite: true,
				roleCategory: "后端开发",
				skill: "Java",
				sortOrder: "asc",
			},
		});
	});

	it("rejects unsupported tracking filters", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/jobs?trackingStatus=unknown-status",
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error.message).toBe("无效的求职状态");
	});

	it("rejects unsupported role categories", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/jobs?roleCategory=Java开发",
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error.message).toBe("无效的岗位方向");
	});

	it("rejects unsupported time sorting", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/jobs?sortOrder=random",
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error.message).toBe("无效的时间排序");
	});

	it("returns job facets", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/jobs/facets?sourceId=linux-do-source&remoteType=remote&roleCategory=后端开发&skill=Java&favorite=true",
		});

		expect(response.statusCode).toBe(200);
		expect(service.findFacets).toHaveBeenCalledWith({
			search: undefined,
			sourceId: "linux-do-source",
			remoteType: "remote",
			trackingStatus: undefined,
			favorite: true,
			roleCategory: "后端开发",
			skill: "Java",
		});
	});

	it("updates a posting tracking status", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/jobs/job-1/tracking",
			payload: { status: "applied", notes: "已发送简历" },
		});

		expect(response.statusCode).toBe(200);
		expect(service.updateTracking).toHaveBeenCalledWith({
			postingId: "job-1",
			status: "applied",
			isFavorite: undefined,
			notes: "已发送简历",
		});
	});

	it("preserves tracking notes when notes are omitted", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/jobs/job-1/tracking",
			payload: { status: "interview" },
		});

		expect(response.statusCode).toBe(200);
		expect(service.updateTracking).toHaveBeenCalledWith({
			postingId: "job-1",
			status: "interview",
			isFavorite: undefined,
			notes: undefined,
		});
	});

	it("clears tracking notes when notes are null", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/jobs/job-1/tracking",
			payload: { notes: null },
		});

		expect(response.statusCode).toBe(200);
		expect(service.updateTracking).toHaveBeenCalledWith({
			postingId: "job-1",
			status: undefined,
			isFavorite: undefined,
			notes: null,
		});
	});

	it("toggles favorite independently from the tracking status", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/jobs/job-1/tracking",
			payload: { isFavorite: true },
		});

		expect(response.statusCode).toBe(200);
		expect(service.updateTracking).toHaveBeenCalledWith({
			postingId: "job-1",
			status: undefined,
			isFavorite: true,
			notes: undefined,
		});
	});
});

import fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleError } from "../lib/errors";
import { sourcesRoutes } from "../routes/v1/sources.routes";
import type { SourcesService } from "../services/sources.service";

describe("Sources routes", () => {
	let app: FastifyInstance;
	const service = {
		findAll: vi.fn(),
		getHealthStatus: vi.fn(),
		setEnabled: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();
		service.findAll.mockResolvedValue([]);
		service.getHealthStatus.mockResolvedValue({
			success: true,
			data: {
				sources: [],
				summary: {
					total: 0,
					healthy: 0,
					delayed: 0,
					error: 0,
					pending: 0,
					disabled: 0,
				},
			},
		});
		service.setEnabled.mockResolvedValue({
			id: "source-1",
			enabled: false,
		});

		app = fastify();
		app.setErrorHandler(handleError);
		await sourcesRoutes(app, service as unknown as SourcesService);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	it("updates a source runtime enabled state", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/sources/source-1/enabled",
			payload: { enabled: false },
		});

		expect(response.statusCode).toBe(200);
		expect(service.setEnabled).toHaveBeenCalledWith("source-1", false);
		expect(response.json().data.enabled).toBe(false);
	});

	it("rejects a non-boolean enabled value", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/sources/source-1/enabled",
			payload: { enabled: "false" },
		});

		expect(response.statusCode).toBe(400);
		expect(service.setEnabled).not.toHaveBeenCalled();
	});
});

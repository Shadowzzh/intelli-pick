// apps/api/src/__tests__/contents.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../app.js";
import type { FastifyInstance } from "fastify";

describe("Contents API", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = await createApp();
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("GET /health returns health status", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/health",
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(true);
		expect(body.data.status).toBe("ok");
	});

	it("GET /api/v1/contents returns paginated contents", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/v1/contents?page=1&limit=20",
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
		expect(body.meta).toHaveProperty("total");
		expect(body.meta).toHaveProperty("page");
		expect(body.meta).toHaveProperty("limit");
		expect(body.meta).toHaveProperty("totalPages");
	});

	it("GET /api/v1/contents/:id returns 404 for non-existent content", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/v1/contents/non-existent-id",
		});

		expect(response.statusCode).toBe(404);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("NOT_FOUND");
	});
});

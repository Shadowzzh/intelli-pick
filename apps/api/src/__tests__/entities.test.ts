import type { FastifyInstance } from "fastify";
// apps/api/src/__tests__/entities.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("Entities API", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = await createApp();
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("GET /api/v1/entities returns paginated entities", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/v1/entities?page=1&limit=20",
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
		expect(body.meta).toHaveProperty("total");
	});

	it("GET /api/v1/entities/:id returns 404 for non-existent entity", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/v1/entities/non-existent-id",
		});

		expect(response.statusCode).toBe(404);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(false);
	});
});

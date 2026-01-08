import type { FastifyInstance } from "fastify";
// apps/api/src/__tests__/search.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("Search API", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = await createApp();
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("POST /api/v1/search returns search results", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/v1/search",
			payload: {
				query: "AI",
				limit: 10,
			},
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(true);
		expect(body.data).toHaveProperty("contents");
		expect(body.data).toHaveProperty("meta");
	});

	it("POST /api/v1/search returns validation error without query", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/v1/search",
			payload: {},
		});

		expect(response.statusCode).toBe(400);
		const body = JSON.parse(response.body);
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});
});

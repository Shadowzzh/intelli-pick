import fastify from "fastify";
import { describe, expect, it } from "vitest";
import {
	ApiMetricsCollector,
	registerApiMetricsHooks,
	shouldTrackApiRequest,
} from "../lib/api-metrics";

describe("API metrics collector", () => {
	it("aggregates requests inside the rolling window", () => {
		const collector = new ApiMetricsCollector(10);
		const now = 1_000_000;
		collector.record({
			durationMs: 10,
			statusCode: 200,
			timestamp: now - 1000,
		});
		collector.record({ durationMs: 30, statusCode: 503, timestamp: now });

		expect(collector.getSnapshot(now)).toEqual({
			windowMinutes: 10,
			requestCount: 2,
			avgResponseTime: 20,
			errorRate: 0.5,
		});
	});

	it("removes expired requests", () => {
		const collector = new ApiMetricsCollector(10);
		const now = 1_000_000;
		collector.record({
			durationMs: 10,
			statusCode: 200,
			timestamp: now - 10 * 60 * 1000 - 1,
		});
		collector.record({ durationMs: 20, statusCode: 200, timestamp: now });

		expect(collector.getSnapshot(now).requestCount).toBe(1);
	});

	it("excludes health, monitoring and socket requests", () => {
		expect(shouldTrackApiRequest("/health")).toBe(false);
		expect(shouldTrackApiRequest("/api/v1/monitoring")).toBe(false);
		expect(shouldTrackApiRequest("/socket.io/")).toBe(false);
		expect(shouldTrackApiRequest("/api/v1/contents")).toBe(true);
	});

	it("collects completed Fastify requests through the response hook", async () => {
		const collector = new ApiMetricsCollector(10);
		const app = fastify();
		registerApiMetricsHooks(app, collector);
		app.get("/health", async () => ({ ok: true }));
		app.get("/api/v1/contents", async () => ({ items: [] }));
		app.get("/api/v1/failure", async (_request, reply) => {
			return reply.code(500).send({ error: true });
		});

		await app.inject({ method: "GET", url: "/health" });
		await app.inject({ method: "GET", url: "/api/v1/contents" });
		await app.inject({ method: "GET", url: "/api/v1/failure" });

		const snapshot = collector.getSnapshot();
		expect(snapshot.requestCount).toBe(2);
		expect(snapshot.errorRate).toBe(0.5);
		await app.close();
	});
});

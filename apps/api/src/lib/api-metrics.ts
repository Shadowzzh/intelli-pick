import type { SystemResourceMetrics } from "@intellipick/shared";
import type { FastifyInstance } from "fastify";

interface ApiRequestMetric {
	timestamp: number;
	durationMs: number;
	statusCode: number;
}

const DEFAULT_WINDOW_MINUTES = 10;

export function shouldTrackApiRequest(path: string): boolean {
	if (path === "/health" || path === "/api/v1/monitoring") {
		return false;
	}
	return !path.startsWith("/socket.io");
}

export function registerApiMetricsHooks(
	app: FastifyInstance,
	collector: ApiMetricsCollector,
): void {
	app.addHook("onResponse", async (request, reply) => {
		const path = (request.raw.url || request.url).split("?", 1)[0];
		if (!shouldTrackApiRequest(path)) {
			return;
		}
		collector.record({
			durationMs: reply.elapsedTime,
			statusCode: reply.statusCode,
		});
	});
}

export class ApiMetricsCollector {
	private metrics: ApiRequestMetric[] = [];
	private readonly windowMs: number;

	constructor(private readonly windowMinutes = DEFAULT_WINDOW_MINUTES) {
		this.windowMs = windowMinutes * 60 * 1000;
	}

	record(params: {
		durationMs: number;
		statusCode: number;
		timestamp?: number;
	}): void {
		const timestamp = params.timestamp ?? Date.now();
		this.metrics.push({
			timestamp,
			durationMs: Math.max(0, params.durationMs),
			statusCode: params.statusCode,
		});
		this.prune(timestamp);
	}

	getSnapshot(now = Date.now()): SystemResourceMetrics["api"] {
		this.prune(now);
		const requestCount = this.metrics.length;
		let totalDurationMs = 0;
		let errorCount = 0;

		for (const metric of this.metrics) {
			totalDurationMs += metric.durationMs;
			if (metric.statusCode >= 500) {
				errorCount++;
			}
		}

		let avgResponseTime = 0;
		let errorRate = 0;
		if (requestCount > 0) {
			avgResponseTime = totalDurationMs / requestCount;
			errorRate = errorCount / requestCount;
		}

		return {
			windowMinutes: this.windowMinutes,
			requestCount,
			avgResponseTime,
			errorRate,
		};
	}

	private prune(now: number): void {
		const cutoff = now - this.windowMs;
		this.metrics = this.metrics.filter((metric) => metric.timestamp >= cutoff);
	}
}

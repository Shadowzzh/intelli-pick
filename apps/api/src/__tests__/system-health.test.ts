import { describe, expect, it } from "vitest";
import {
	type SystemStatusInput,
	deriveSystemStatus,
} from "../services/monitoring.service";
import { parseRedisMemoryInfo } from "../services/queue.service";

function createHealthyInput(
	overrides: Partial<SystemStatusInput> = {},
): SystemStatusInput {
	return {
		databaseConnected: true,
		redisConnected: true,
		queueWaiting: 0,
		queueFailed: 0,
		workerTotal: 1,
		sourceTotal: 12,
		sourceDisabled: 1,
		sourceDelayed: 0,
		sourceErrors: 0,
		sourcePending: 0,
		extractSuccessRate: 1,
		apiRequestCount: 20,
		apiErrorRate: 0,
		...overrides,
	};
}

describe("system health", () => {
	it("returns healthy when all checks pass", () => {
		expect(deriveSystemStatus(createHealthyInput())).toBe("healthy");
	});

	it("returns error when a required dependency is disconnected", () => {
		expect(
			deriveSystemStatus(createHealthyInput({ redisConnected: false })),
		).toBe("error");
	});

	it("returns error when active sources have no registered worker", () => {
		expect(deriveSystemStatus(createHealthyInput({ workerTotal: 0 }))).toBe(
			"error",
		);
	});

	it("returns warning for source or AI degradation", () => {
		expect(deriveSystemStatus(createHealthyInput({ sourceErrors: 1 }))).toBe(
			"warning",
		);
		expect(
			deriveSystemStatus(createHealthyInput({ extractSuccessRate: 0.9 })),
		).toBe("warning");
	});

	it("returns error for a sustained API error rate", () => {
		expect(
			deriveSystemStatus(
				createHealthyInput({ apiRequestCount: 10, apiErrorRate: 0.2 }),
			),
		).toBe("error");
	});
});

describe("Redis memory info", () => {
	it("parses used memory and an unlimited maxmemory value", () => {
		expect(
			parseRedisMemoryInfo("used_memory:4560352\r\nmaxmemory:0\r\n"),
		).toEqual({ memoryUsage: 4560352, memoryLimit: 0 });
	});
});

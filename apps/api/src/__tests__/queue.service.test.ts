import { describe, expect, it } from "vitest";
import { deriveWorkerStats } from "../services/queue.service";

describe("worker stats", () => {
	it("keeps idle registered workers in the total", () => {
		expect(deriveWorkerStats(1, 0)).toEqual({ active: 0, total: 1 });
	});

	it("does not report more active workers than registered workers", () => {
		expect(deriveWorkerStats(1, 5)).toEqual({ active: 1, total: 1 });
		expect(deriveWorkerStats(2, 1)).toEqual({ active: 1, total: 2 });
	});
});

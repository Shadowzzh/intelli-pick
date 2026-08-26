import type { Source } from "@intellipick/db";
import { SourceHealthStatus } from "@intellipick/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SourcesRepository } from "../repositories/sources.repository";
import { SourcesService } from "../services/sources.service";

const NOW = new Date("2026-08-27T00:00:00.000Z");

function createSource(overrides: Partial<Source>): Source {
	return {
		id: "source-1",
		name: "Test Source",
		type: "rss",
		config: { url: "https://example.com/feed.xml" },
		enabled: true,
		isConfigured: true,
		fetchInterval: 7200,
		scheduleMinute: 0,
		lastAttemptedAt: null,
		lastFetchedAt: null,
		lastFetchStatus: "never",
		lastFetchError: null,
		lastItemCount: null,
		lastNewCount: null,
		lastDurationMs: null,
		createdAt: NOW,
		updatedAt: NOW,
		...overrides,
	};
}

describe("SourcesService", () => {
	const repository = {
		findById: vi.fn(),
		findAll: vi.fn(),
		updateEnabled: vi.fn(),
	};
	let service: SourcesService;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		vi.clearAllMocks();
		service = new SourcesService(repository as unknown as SourcesRepository);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports real health states using status and source intervals", async () => {
		repository.findAll.mockResolvedValue([
			createSource({ id: "disabled", enabled: false }),
			createSource({ id: "pending" }),
			createSource({
				id: "failed",
				lastFetchStatus: "failed",
				lastFetchError: "HTTP 503",
			}),
			createSource({
				id: "healthy",
				lastFetchStatus: "success",
				lastFetchedAt: new Date(NOW.getTime() - 60 * 60 * 1000),
			}),
			createSource({
				id: "delayed",
				lastFetchStatus: "success",
				lastFetchedAt: new Date(NOW.getTime() - 4 * 60 * 60 * 1000),
			}),
		]);

		const result = await service.getHealthStatus();
		const states = Object.fromEntries(
			result.data.sources.map((source) => [source.id, source.healthStatus]),
		);

		expect(states).toEqual({
			disabled: SourceHealthStatus.DISABLED,
			pending: SourceHealthStatus.PENDING,
			failed: SourceHealthStatus.ERROR,
			healthy: SourceHealthStatus.HEALTHY,
			delayed: SourceHealthStatus.DELAYED,
		});
		expect(result.data.summary).toEqual({
			total: 5,
			healthy: 1,
			delayed: 1,
			error: 1,
			pending: 1,
			disabled: 1,
		});
	});

	it("persists a runtime toggle without changing collection history", async () => {
		const current = createSource({
			lastFetchStatus: "success",
			lastFetchedAt: new Date(NOW.getTime() - 60 * 60 * 1000),
		});
		const updated = createSource({ ...current, enabled: false });
		repository.findById.mockResolvedValue(current);
		repository.updateEnabled.mockResolvedValue(updated);

		const result = await service.setEnabled(current.id, false);

		expect(repository.updateEnabled).toHaveBeenCalledWith(current.id, false);
		expect(result.enabled).toBe(false);
		expect(result.lastFetchedAt).toEqual(current.lastFetchedAt);
		expect(result.healthStatus).toBe(SourceHealthStatus.DISABLED);
	});
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	type HeartbeatFetch,
	createHeartbeatUrl,
	sendUptimeKumaHeartbeat,
} from "./uptime-heartbeat";

describe("Uptime Kuma Worker heartbeat", () => {
	it("adds the supported Push monitor parameters", () => {
		const url = new URL(
			createHeartbeatUrl("http://uptime-kuma:3001/api/push/secret-token"),
		);

		assert.equal(url.pathname, "/api/push/secret-token");
		assert.equal(url.searchParams.get("status"), "up");
		assert.equal(url.searchParams.get("msg"), "IntelliPick Worker online");
	});

	it("accepts a successful Uptime Kuma response", async () => {
		const fetchImpl: HeartbeatFetch = async () => ({
			ok: true,
			status: 200,
			json: async () => ({ ok: true }),
		});

		await sendUptimeKumaHeartbeat({
			pushUrl: "http://uptime-kuma:3001/api/push/secret-token",
			timeoutMs: 1000,
			fetchImpl,
		});
	});

	it("rejects unsuccessful or invalid responses without exposing the token", async () => {
		const fetchImpl: HeartbeatFetch = async () => ({
			ok: false,
			status: 404,
			json: async () => ({ ok: false }),
		});

		await assert.rejects(
			sendUptimeKumaHeartbeat({
				pushUrl: "http://uptime-kuma:3001/api/push/secret-token",
				timeoutMs: 1000,
				fetchImpl,
			}),
			(error: Error) => {
				assert.match(error.message, /HTTP 404/);
				assert.ok(!error.message.includes("secret-token"));
				return true;
			},
		);
	});
});

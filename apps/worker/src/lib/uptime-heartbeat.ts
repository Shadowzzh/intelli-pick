import type { Logger } from "pino";
import { fetch } from "undici";

interface HeartbeatResponse {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
}

export type HeartbeatFetch = (
	url: string,
	init: { signal: AbortSignal },
) => Promise<HeartbeatResponse>;

interface SendHeartbeatOptions {
	pushUrl: string;
	timeoutMs: number;
	fetchImpl?: HeartbeatFetch;
}

interface StartHeartbeatOptions extends SendHeartbeatOptions {
	intervalMs: number;
	logger: Logger;
}

export function createHeartbeatUrl(pushUrl: string): string {
	const url = new URL(pushUrl);
	url.searchParams.set("status", "up");
	url.searchParams.set("msg", "IntelliPick Worker online");
	return url.toString();
}

export async function sendUptimeKumaHeartbeat({
	pushUrl,
	timeoutMs,
	fetchImpl = fetch,
}: SendHeartbeatOptions): Promise<void> {
	const response = await fetchImpl(createHeartbeatUrl(pushUrl), {
		signal: AbortSignal.timeout(timeoutMs),
	});
	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}

	const accepted =
		typeof payload === "object" &&
		payload !== null &&
		"ok" in payload &&
		payload.ok === true;
	if (!response.ok || !accepted) {
		throw new Error(
			`Uptime Kuma rejected heartbeat with HTTP ${response.status}`,
		);
	}
}

export function startUptimeKumaHeartbeat({
	pushUrl,
	intervalMs,
	timeoutMs,
	logger,
	fetchImpl,
}: StartHeartbeatOptions): { stop: () => void } {
	let stopped = false;
	let inFlight = false;

	const sendNow = async () => {
		if (stopped || inFlight) {
			return;
		}

		inFlight = true;
		try {
			await sendUptimeKumaHeartbeat({ pushUrl, timeoutMs, fetchImpl });
			logger.debug("Uptime Kuma Worker heartbeat sent");
		} catch (err) {
			logger.error({ err }, "Failed to send Uptime Kuma Worker heartbeat");
		} finally {
			inFlight = false;
		}
	};

	void sendNow();
	const timer = setInterval(() => {
		void sendNow();
	}, intervalMs);
	timer.unref();

	return {
		stop: () => {
			stopped = true;
			clearInterval(timer);
		},
	};
}

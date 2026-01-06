// apps/api/src/lib/proxy.ts
import type { Config } from "@ai-filter/config";
import { ProxyAgent } from "undici";

let proxyAgent: ProxyAgent | undefined;

export function initializeProxy(config: Config) {
	const proxyUrl = config.network?.httpProxy;

	if (proxyUrl) {
		proxyAgent = new ProxyAgent(proxyUrl);
		console.log("🔧 Proxy config:", { proxyUrl, hasDispatcher: true });
	} else {
		console.log("🔧 Proxy config:", { proxyUrl: null, hasDispatcher: false });
	}
}

export function getProxyAgent(): ProxyAgent | undefined {
	return proxyAgent;
}

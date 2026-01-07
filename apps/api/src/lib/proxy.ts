// apps/api/src/lib/proxy.ts
import type { Config } from "@intellipick/config";
import { ProxyAgent } from "undici";
import { HttpsProxyAgent } from "https-proxy-agent";

let proxyAgent: ProxyAgent | undefined;
let nodeProxyAgent: HttpsProxyAgent<string> | undefined;

export function initializeProxy(config: Config) {
	const proxyUrl = config.network?.httpProxy;

	if (proxyUrl) {
		proxyAgent = new ProxyAgent(proxyUrl);
		nodeProxyAgent = new HttpsProxyAgent(proxyUrl);
		console.log("🔧 Proxy config:", { proxyUrl, hasDispatcher: true });
	} else {
		console.log("🔧 Proxy config:", { proxyUrl: null, hasDispatcher: false });
	}
}

export function getProxyAgent(): ProxyAgent | undefined {
	return proxyAgent;
}

export function getNodeProxyAgent(): HttpsProxyAgent<string> | undefined {
	return nodeProxyAgent;
}

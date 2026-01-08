// apps/api/src/index.ts
import { loadConfig } from "@intellipick/config";
import { createApp } from "./app.js";

async function main() {
	// Load configuration
	const config = await loadConfig("../../config.ts");

	const app = await createApp(config);

	const port = Number.parseInt(process.env.API_PORT || "3000");
	const host = process.env.API_HOST || "0.0.0.0";

	await app.listen({ port, host });

	console.log(`API server listening on http://${host}:${port}`);
}

main().catch((err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});

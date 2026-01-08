// apps/api/src/index.ts
import { loadConfig } from "@intellipick/config";
import { createApp } from "./app.js";
import { initSocket } from "./lib/socket.js";

async function main() {
	// Load configuration
	const config = await loadConfig("../../config.ts");

	const app = await createApp(config);

	// Initialize Socket.IO before starting the server
	await initSocket(app);

	const port = Number.parseInt(process.env.API_PORT || "3001");
	const host = process.env.API_HOST || "0.0.0.0";

	await app.listen({ port, host });

	console.log(`API server listening on http://${host}:${port}`);
}

main().catch((err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});

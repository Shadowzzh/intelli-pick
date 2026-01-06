// apps/api/src/index.ts
import { loadConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";

const logger = createLogger("main");

async function main() {
  logger.info("Starting AI Filter...");

  const config = loadConfig();
  logger.info({ sources: config.sources.length }, "Loaded config");

  // TODO: Initialize collector, pipeline, scheduler
}

main().catch((err) => {
  logger.error(err, "Fatal error");
  process.exit(1);
});

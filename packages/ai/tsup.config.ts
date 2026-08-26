import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	external: [/^(@ai-sdk|@intellipick|ai)/],
	target: "es2022",
});

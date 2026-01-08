import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	// 保持 workspace 包为外部引用
	external: [/^(@intellipick|jiti|zod)/],
	target: "es2022",
});

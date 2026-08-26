import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"schema/index": "src/schema/index.ts",
		"schema/sources": "src/schema/sources.ts",
		"schema/contents": "src/schema/contents.ts",
		"schema/entities": "src/schema/entities.ts",
		"schema/entity-mentions": "src/schema/entity-mentions.ts",
		"schema/tags": "src/schema/tags.ts",
		"schema/quarantine": "src/schema/quarantine.ts",
		"schema/job-history": "src/schema/job-history.ts",
		"schema/jobs": "src/schema/jobs.ts",
		client: "src/client.ts",
	},
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	// 保持 workspace 包和数据库库为外部引用
	external: [/^(@intellipick|drizzle-orm|nanoid|postgres)/],
	target: "es2022",
});

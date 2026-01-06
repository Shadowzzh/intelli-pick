import type { SourceConfig } from "@ai-filter/config";
// apps/api/src/collector/types.ts
import type { RawContent } from "@ai-filter/shared";

export interface CollectorPlugin {
	type: string;
	collect(source: SourceConfig): Promise<RawContent[]>;
}

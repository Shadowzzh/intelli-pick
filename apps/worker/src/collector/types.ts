import type { SourceConfig } from "@intellipick/config";
// apps/api/src/collector/types.ts
import type { RawContent } from "@intellipick/shared";

export interface CollectorPlugin {
	type: string;
	collect(source: SourceConfig, sourceId: string): Promise<RawContent[]>;
}

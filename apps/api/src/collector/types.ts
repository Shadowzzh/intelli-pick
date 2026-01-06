// apps/api/src/collector/types.ts
import type { RawContent } from "@ai-filter/shared";
import type { SourceConfig } from "../lib/config.js";

export interface CollectorPlugin {
  type: string;
  collect(source: SourceConfig): Promise<RawContent[]>;
}

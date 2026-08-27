// apps/api/src/pipeline/dedup.ts
import { contents, db, quarantine } from "@intellipick/db";
import { and, eq, or } from "drizzle-orm";
import type { Logger } from "pino";
import { createLogger } from "../lib/logger";
import {
	type PipelineContext,
	type PipelineStep,
	type StepResult,
	StepStatus,
} from "./types";

const logger = createLogger("dedup");

export class DedupStep implements PipelineStep {
	name = "dedup";

	async process(
		ctx: PipelineContext,
		stepLogger?: Logger,
	): Promise<StepResult> {
		const log = stepLogger || logger;
		const { raw } = ctx;

		const [existingContent, existingQuarantine] = await Promise.all([
			db.query.contents.findFirst({
				where: or(
					eq(contents.url, raw.url),
					and(
						eq(contents.sourceId, raw.sourceId),
						eq(contents.externalId, raw.externalId),
					),
				),
			}),
			db.query.quarantine.findFirst({
				where: or(
					eq(quarantine.url, raw.url),
					and(
						eq(quarantine.sourceId, raw.sourceId),
						eq(quarantine.externalId, raw.externalId),
					),
				),
			}),
		]);

		if (existingContent || existingQuarantine) {
			log.debug(
				{ url: raw.url, externalId: raw.externalId },
				"Duplicate found, skipping",
			);
			return {
				status: StepStatus.Filtered,
				context: ctx,
			};
		}

		return {
			status: StepStatus.Continue,
			context: ctx,
		};
	}
}

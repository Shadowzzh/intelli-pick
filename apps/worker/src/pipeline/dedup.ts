// apps/api/src/pipeline/dedup.ts
import { contents, db } from "@intellipick/db";
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

		const existingContent = await db.query.contents.findFirst({
			where: or(
				eq(contents.url, raw.url),
				and(
					eq(contents.sourceId, raw.sourceId),
					eq(contents.externalId, raw.externalId),
				),
			),
		});

		if (existingContent) {
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

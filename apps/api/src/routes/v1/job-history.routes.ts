import type { JobHistoryStatus } from "@intellipick/shared";
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../lib/errors";
import type { JobHistoryService } from "../../services/job-history.service";

interface JobHistoryQuery {
	page?: string;
	limit?: string;
	status?: JobHistoryStatus;
	sourceType?: string;
	success?: string;
	startDate?: string;
	endDate?: string;
}

function parsePositiveInteger(
	value: string | undefined,
	fallback: number,
	maximum: number,
): number {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, maximum);
}

function parseOptionalDate(value: string | undefined): Date | undefined {
	if (!value) return undefined;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return undefined;
	return parsed;
}

export async function jobHistoryRoutes(
	app: FastifyInstance,
	service: JobHistoryService,
) {
	app.get<{ Querystring: JobHistoryQuery }>(
		"/job-history",
		{
			schema: {
				querystring: {
					type: "object",
					properties: {
						page: { type: "string" },
						limit: { type: "string" },
						status: {
							type: "string",
							enum: ["completed", "failed"],
						},
						sourceType: { type: "string" },
						success: { type: "string", enum: ["true", "false"] },
						startDate: { type: "string" },
						endDate: { type: "string" },
					},
				},
			},
		},
		async (req) => {
			const filters = {
				status: req.query.status,
				sourceType: req.query.sourceType,
				success:
					req.query.success === undefined
						? undefined
						: req.query.success === "true",
				startDate: parseOptionalDate(req.query.startDate),
				endDate: parseOptionalDate(req.query.endDate),
			};

			return service.findPaginated({
				page: parsePositiveInteger(req.query.page, 1, 1_000_000),
				limit: parsePositiveInteger(req.query.limit, 20, 100),
				filters,
			});
		},
	);

	app.get<{
		Querystring: Pick<JobHistoryQuery, "startDate" | "endDate">;
	}>("/job-history/stats", async (req) => {
		return service.getStats({
			startDate: parseOptionalDate(req.query.startDate),
			endDate: parseOptionalDate(req.query.endDate),
		});
	});

	app.get<{ Params: { jobId: string } }>(
		"/job-history/job/:jobId",
		async (req) => {
			const result = await service.findByJobId(req.params.jobId);
			if (!result.success) {
				throw new NotFoundError("Job history", req.params.jobId);
			}
			return result;
		},
	);

	app.get<{ Params: { id: string } }>(
		"/job-history/:id",
		async (req, reply) => {
			const id = Number.parseInt(req.params.id, 10);
			if (!Number.isFinite(id) || id < 1) {
				reply.code(400);
				return { success: false, error: "Invalid job history id" };
			}

			const result = await service.findById(id);
			if (!result.success) reply.code(404);
			return result;
		},
	);
}

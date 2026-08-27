import {
	DEFAULT_DUPLICATE_AUDIT_OPTIONS,
	type DedupContentInput,
	type DuplicateAuditOptions,
	type DuplicateClassification,
	findDuplicateCandidates,
} from "@intellipick/shared";

async function readStdin(): Promise<string> {
	let input = "";
	for await (const chunk of process.stdin) {
		input += chunk;
	}
	return input;
}

function readNumberArgument(name: string, fallback: number): number {
	const prefix = `--${name}=`;
	const argument = process.argv.find((value) => value.startsWith(prefix));
	if (!argument) {
		return fallback;
	}
	const parsed = Number.parseFloat(argument.slice(prefix.length));
	if (!Number.isFinite(parsed)) {
		throw new Error(`${name} 必须是数字`);
	}
	return parsed;
}

function countByClassification(
	classifications: DuplicateClassification[],
): Record<DuplicateClassification, number> {
	return {
		exact: classifications.filter((value) => value === "exact").length,
		automatic: classifications.filter((value) => value === "automatic").length,
		review: classifications.filter((value) => value === "review").length,
	};
}

async function main() {
	const input = await readStdin();
	const items = JSON.parse(input) as DedupContentInput[];
	if (!Array.isArray(items)) {
		throw new Error("输入必须是内容数组");
	}

	const options: DuplicateAuditOptions = {
		automaticThreshold: readNumberArgument(
			"automatic-threshold",
			DEFAULT_DUPLICATE_AUDIT_OPTIONS.automaticThreshold,
		),
		reviewThreshold: readNumberArgument(
			"review-threshold",
			DEFAULT_DUPLICATE_AUDIT_OPTIONS.reviewThreshold,
		),
		automaticMaxTimeDistanceHours: readNumberArgument(
			"automatic-max-hours",
			DEFAULT_DUPLICATE_AUDIT_OPTIONS.automaticMaxTimeDistanceHours,
		),
		sameSourceAutomaticMaxTimeDistanceHours: readNumberArgument(
			"same-source-automatic-max-hours",
			DEFAULT_DUPLICATE_AUDIT_OPTIONS.sameSourceAutomaticMaxTimeDistanceHours,
		),
		maxTimeDistanceHours: readNumberArgument(
			"max-hours",
			DEFAULT_DUPLICATE_AUDIT_OPTIONS.maxTimeDistanceHours,
		),
	};
	const maxCandidates = Math.max(
		1,
		Math.round(readNumberArgument("max-candidates", 200)),
	);
	const candidates = findDuplicateCandidates(items, options);
	const classifications = candidates.map(
		(candidate) => candidate.classification,
	);
	const counts = countByClassification(classifications);
	const crossSourceCount = candidates.filter(
		(candidate) => candidate.left.sourceId !== candidate.right.sourceId,
	).length;

	console.log(
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				options,
				summary: {
					items: items.length,
					comparedPairs: (items.length * (items.length - 1)) / 2,
					candidates: candidates.length,
					...counts,
					crossSource: crossSourceCount,
					omittedCandidates: Math.max(0, candidates.length - maxCandidates),
				},
				candidates: candidates.slice(0, maxCandidates),
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

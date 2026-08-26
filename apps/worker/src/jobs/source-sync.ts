import type { JobsConfig } from "@intellipick/config";
import { db, jobSources } from "@intellipick/db";

export async function syncJobSources(
	config: JobsConfig,
): Promise<Map<string, string>> {
	const sourceMap = new Map<string, string>();

	for (const source of config.sources) {
		const [saved] = await db
			.insert(jobSources)
			.values({
				key: source.key,
				name: source.name,
				type: source.type,
				url: source.url,
				enabled: source.enabled,
				fetchInterval: source.fetchInterval,
			})
			.onConflictDoUpdate({
				target: jobSources.key,
				set: {
					name: source.name,
					type: source.type,
					url: source.url,
					enabled: source.enabled,
					fetchInterval: source.fetchInterval,
					updatedAt: new Date(),
				},
			})
			.returning({ id: jobSources.id, key: jobSources.key });

		sourceMap.set(saved.key, saved.id);
	}

	return sourceMap;
}

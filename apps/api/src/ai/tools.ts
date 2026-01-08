// apps/api/src/ai/tools.ts
export const aiTools = {
	queryContents: {
		description: "Query contents with filters like category, tags, date range",
		parameters: {
			type: "object",
			properties: {
				category: { type: "string", description: "Content category" },
				tags: { type: "array", items: { type: "string" } },
				limit: { type: "number", default: 10 },
			},
		},
	},

	searchContents: {
		description: "Full-text search across content titles, summaries, and text",
		parameters: {
			type: "object",
			properties: {
				query: { type: "string", description: "Search query" },
				limit: { type: "number", default: 10 },
			},
			required: ["query"],
		},
	},

	getTrendingEntities: {
		description:
			"Get trending entities (people, companies, products) ordered by mention count",
		parameters: {
			type: "object",
			properties: {
				limit: { type: "number", default: 10 },
			},
		},
	},
};

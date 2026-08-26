const MAX_JOB_SKILLS = 12;

const SKILL_ALIASES: Record<string, string> = {
	"ai agent": "Agent",
	golang: "Go",
	js: "JavaScript",
	"kubernetes (k8s)": "Kubernetes",
	k8s: "Kubernetes",
	node: "Node.js",
	"node.js": "Node.js",
	nodejs: "Node.js",
	postgres: "PostgreSQL",
	postgresql: "PostgreSQL",
	"react.js": "React",
	reactjs: "React",
	"rest api": "REST API",
	"restful api": "REST API",
	"spring boot": "Spring Boot",
	springboot: "Spring Boot",
	ts: "TypeScript",
	"vue.js": "Vue",
	vuejs: "Vue",
};

export function normalizeJobSkills(values: string[]): string[] {
	const skills: string[] = [];
	const seen = new Set<string>();

	for (const value of values) {
		const compactValue = value.trim().replace(/\s+/g, " ");
		if (!compactValue) {
			continue;
		}

		const aliasKey = compactValue.toLocaleLowerCase("en-US");
		const skill = SKILL_ALIASES[aliasKey] || compactValue;
		const uniqueKey = skill.toLocaleLowerCase("en-US");
		if (seen.has(uniqueKey)) {
			continue;
		}

		seen.add(uniqueKey);
		skills.push(skill);
		if (skills.length === MAX_JOB_SKILLS) {
			break;
		}
	}

	return skills;
}

import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import {
	type AuthService,
	createAuthService,
	createPasswordHash,
} from "../lib/auth";

const TEST_USERNAME = "sift-test";
const TEST_PASSWORD = "test-password";

function getSessionCookie(app: FastifyInstance, setCookie: string): string {
	const cookiePair = setCookie.split(";", 1)[0];
	if (!cookiePair) {
		throw new Error("Missing session cookie");
	}

	const parsed = app.parseCookie(cookiePair);
	if (!parsed.sift_session) {
		throw new Error("Missing sift_session cookie");
	}
	return cookiePair;
}

describe("Authentication API", () => {
	let app: FastifyInstance;
	let auth: AuthService;

	beforeAll(async () => {
		auth = createAuthService({
			username: TEST_USERNAME,
			passwordHash: await createPasswordHash(TEST_PASSWORD),
			sessionSecret: "test-session-secret-with-at-least-32-characters",
			sessionTtlSeconds: 60 * 60,
			rememberTtlSeconds: 30 * 24 * 60 * 60,
			secureCookie: false,
		});
		app = await createApp(undefined, auth);
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("keeps health public and protects API and GraphQL", async () => {
		const health = await app.inject({ method: "GET", url: "/health" });
		const api = await app.inject({ method: "GET", url: "/api/v1/contents" });
		const graphql = await app.inject({ method: "POST", url: "/graphql" });

		expect(health.statusCode).toBe(200);
		expect(api.statusCode).toBe(401);
		expect(graphql.statusCode).toBe(401);
		expect(api.json().error.code).toBe("UNAUTHORIZED");
	});

	it("rejects invalid credentials without setting a session cookie", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/v1/auth/login",
			payload: {
				username: TEST_USERNAME,
				password: "wrong-password",
				remember: false,
			},
		});

		expect(response.statusCode).toBe(401);
		expect(response.headers["set-cookie"]).toBeUndefined();
		expect(response.json().error.message).toBe("用户名或密码错误");
	});

	it("creates a signed session and clears it on logout", async () => {
		const login = await app.inject({
			method: "POST",
			url: "/api/v1/auth/login",
			payload: {
				username: TEST_USERNAME,
				password: TEST_PASSWORD,
				remember: false,
			},
		});

		expect(login.statusCode).toBe(200);
		const setCookie = login.headers["set-cookie"];
		expect(typeof setCookie).toBe("string");
		const cookie = getSessionCookie(app, setCookie as string);
		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toContain("SameSite=Lax");
		expect(setCookie).not.toContain("Max-Age");

		const session = await app.inject({
			method: "GET",
			url: "/api/v1/auth/session",
			headers: { cookie },
		});
		expect(session.statusCode).toBe(200);
		expect(session.json().data.username).toBe(TEST_USERNAME);

		const logout = await app.inject({
			method: "POST",
			url: "/api/v1/auth/logout",
			headers: { cookie },
		});
		expect(logout.statusCode).toBe(200);
		expect(logout.headers["set-cookie"]).toContain("Max-Age=0");

		const sessionWithoutCookie = await app.inject({
			method: "GET",
			url: "/api/v1/auth/session",
		});
		expect(sessionWithoutCookie.statusCode).toBe(401);
	});

	it("uses a persistent cookie only when remember is enabled", async () => {
		const login = await app.inject({
			method: "POST",
			url: "/api/v1/auth/login",
			payload: {
				username: TEST_USERNAME,
				password: TEST_PASSWORD,
				remember: true,
			},
		});

		expect(login.statusCode).toBe(200);
		expect(login.headers["set-cookie"]).toContain("Max-Age=2592000");
	});
});

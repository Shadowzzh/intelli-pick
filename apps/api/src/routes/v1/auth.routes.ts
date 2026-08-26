import type { FastifyInstance } from "fastify";
import type { AuthService } from "../../lib/auth";
import { UnauthorizedError, ValidationError } from "../../lib/errors";

interface LoginBody {
	username?: unknown;
	password?: unknown;
	remember?: unknown;
}

export async function authRoutes(app: FastifyInstance, auth: AuthService) {
	app.post(
		"/auth/login",
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "1 minute",
				},
			},
		},
		async (request, reply) => {
			const body = request.body as LoginBody | null;
			if (
				!body ||
				typeof body.username !== "string" ||
				typeof body.password !== "string" ||
				body.username.length < 1 ||
				body.username.length > 128 ||
				body.password.length < 1 ||
				body.password.length > 1024 ||
				(body.remember !== undefined && typeof body.remember !== "boolean")
			) {
				throw new ValidationError("用户名或密码格式不正确");
			}

			const valid = await auth.verifyCredentials(body.username, body.password);
			if (!valid) {
				throw new UnauthorizedError("用户名或密码错误");
			}

			const session = auth.createSession(body.remember === true);
			const cookieOptions = {
				path: "/",
				httpOnly: true,
				secure: auth.config.secureCookie,
				sameSite: "lax" as const,
				signed: true,
			};

			if (session.persistent) {
				reply.setCookie(auth.cookieName, session.value, {
					...cookieOptions,
					maxAge: session.ttlSeconds,
				});
			} else {
				reply.setCookie(auth.cookieName, session.value, cookieOptions);
			}

			return {
				success: true,
				data: { username: auth.config.username },
			};
		},
	);

	app.post("/auth/logout", async (_request, reply) => {
		reply.clearCookie(auth.cookieName, {
			path: "/",
			httpOnly: true,
			secure: auth.config.secureCookie,
			sameSite: "lax",
		});

		return {
			success: true,
			data: { loggedOut: true },
		};
	});

	app.get("/auth/session", async () => ({
		success: true,
		data: { username: auth.config.username },
	}));
}

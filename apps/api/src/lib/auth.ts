import {
	type ScryptOptions,
	createHash,
	randomBytes,
	scrypt as scryptCallback,
	timingSafeEqual,
} from "node:crypto";
import type { FastifyRequest } from "fastify";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;

export const AUTH_COOKIE_NAME = "sift_session";

export interface AuthConfig {
	username: string;
	passwordHash: string;
	sessionSecret: string;
	sessionTtlSeconds: number;
	rememberTtlSeconds: number;
	secureCookie: boolean;
}

export interface AuthSession {
	username: string;
	issuedAt: number;
	expiresAt: number;
}

interface SessionPayload {
	sub: string;
	iat: number;
	exp: number;
}

interface ParsedPasswordHash {
	n: number;
	r: number;
	p: number;
	keyLength: number;
	salt: Buffer;
	digest: Buffer;
}

export interface CreatedSession {
	value: string;
	ttlSeconds: number;
	persistent: boolean;
}

export interface AuthService {
	readonly config: AuthConfig;
	readonly cookieName: string;
	verifyCredentials(username: string, password: string): Promise<boolean>;
	createSession(remember: boolean): CreatedSession;
	verifySession(value: string): AuthSession | null;
}

function scrypt(
	password: string,
	salt: Buffer,
	keyLength: number,
	options: ScryptOptions,
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(derivedKey);
		});
	});
}

function requireEnvValue(runtimeEnv: NodeJS.ProcessEnv, name: string): string {
	const value = runtimeEnv[name]?.trim();
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function parsePositiveInteger(
	value: string | undefined,
	fallback: number,
	name: string,
	max: number,
): number {
	if (value === undefined || value.trim() === "") {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed <= 0 || parsed > max) {
		throw new Error(`${name} must be an integer between 1 and ${max}`);
	}
	return parsed;
}

function parsePasswordHash(encoded: string): ParsedPasswordHash {
	const [algorithm, n, r, p, keyLength, salt, digest, ...extra] =
		encoded.split(":");
	if (
		algorithm !== "scrypt" ||
		extra.length > 0 ||
		!n ||
		!r ||
		!p ||
		!keyLength ||
		!salt ||
		!digest
	) {
		throw new Error("AUTH_PASSWORD_HASH has an invalid format");
	}

	const parsed = {
		n: Number.parseInt(n, 10),
		r: Number.parseInt(r, 10),
		p: Number.parseInt(p, 10),
		keyLength: Number.parseInt(keyLength, 10),
		salt: Buffer.from(salt, "base64url"),
		digest: Buffer.from(digest, "base64url"),
	};

	if (
		!Number.isInteger(parsed.n) ||
		!Number.isInteger(parsed.r) ||
		!Number.isInteger(parsed.p) ||
		!Number.isInteger(parsed.keyLength) ||
		parsed.n < 2 ||
		parsed.r < 1 ||
		parsed.p < 1 ||
		parsed.keyLength < 32 ||
		parsed.salt.length < 16 ||
		parsed.digest.length !== parsed.keyLength
	) {
		throw new Error("AUTH_PASSWORD_HASH has invalid scrypt parameters");
	}

	return parsed;
}

function constantTimeStringEqual(left: string, right: string): boolean {
	const leftDigest = createHash("sha256").update(left).digest();
	const rightDigest = createHash("sha256").update(right).digest();
	return timingSafeEqual(leftDigest, rightDigest);
}

async function verifyPassword(
	password: string,
	encodedHash: string,
): Promise<boolean> {
	const parsed = parsePasswordHash(encodedHash);
	const derivedKey = await scrypt(password, parsed.salt, parsed.keyLength, {
		N: parsed.n,
		r: parsed.r,
		p: parsed.p,
		maxmem: SCRYPT_MAX_MEMORY,
	});

	return timingSafeEqual(derivedKey, parsed.digest);
}

export async function createPasswordHash(password: string): Promise<string> {
	if (!password) {
		throw new Error("Password must not be empty");
	}

	const salt = randomBytes(16);
	const digest = await scrypt(password, salt, SCRYPT_KEY_LENGTH, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P,
		maxmem: SCRYPT_MAX_MEMORY,
	});

	return [
		"scrypt",
		SCRYPT_N,
		SCRYPT_R,
		SCRYPT_P,
		SCRYPT_KEY_LENGTH,
		salt.toString("base64url"),
		digest.toString("base64url"),
	].join(":");
}

export function loadAuthConfig(
	runtimeEnv: NodeJS.ProcessEnv = process.env,
): AuthConfig {
	const username = requireEnvValue(runtimeEnv, "AUTH_USERNAME");
	const passwordHash = requireEnvValue(runtimeEnv, "AUTH_PASSWORD_HASH");
	const sessionSecret = requireEnvValue(runtimeEnv, "AUTH_SESSION_SECRET");

	parsePasswordHash(passwordHash);
	if (sessionSecret.length < 32) {
		throw new Error("AUTH_SESSION_SECRET must contain at least 32 characters");
	}

	const sessionTtlHours = parsePositiveInteger(
		runtimeEnv.AUTH_SESSION_TTL_HOURS,
		12,
		"AUTH_SESSION_TTL_HOURS",
		168,
	);
	const rememberTtlDays = parsePositiveInteger(
		runtimeEnv.AUTH_REMEMBER_TTL_DAYS,
		30,
		"AUTH_REMEMBER_TTL_DAYS",
		365,
	);

	return {
		username,
		passwordHash,
		sessionSecret,
		sessionTtlSeconds: sessionTtlHours * 60 * 60,
		rememberTtlSeconds: rememberTtlDays * 24 * 60 * 60,
		secureCookie: runtimeEnv.NODE_ENV === "production",
	};
}

export function createAuthService(config: AuthConfig): AuthService {
	parsePasswordHash(config.passwordHash);

	return {
		config,
		cookieName: AUTH_COOKIE_NAME,

		async verifyCredentials(username: string, password: string) {
			const passwordMatches = await verifyPassword(
				password,
				config.passwordHash,
			);
			const usernameMatches = constantTimeStringEqual(
				username,
				config.username,
			);
			return usernameMatches && passwordMatches;
		},

		createSession(remember: boolean) {
			const issuedAt = Math.floor(Date.now() / 1000);
			const ttlSeconds = remember
				? config.rememberTtlSeconds
				: config.sessionTtlSeconds;
			const payload: SessionPayload = {
				sub: config.username,
				iat: issuedAt,
				exp: issuedAt + ttlSeconds,
			};

			return {
				value: Buffer.from(JSON.stringify(payload)).toString("base64url"),
				ttlSeconds,
				persistent: remember,
			};
		},

		verifySession(value: string) {
			try {
				const payload = JSON.parse(
					Buffer.from(value, "base64url").toString("utf8"),
				) as Partial<SessionPayload>;
				const now = Math.floor(Date.now() / 1000);

				if (
					typeof payload.sub !== "string" ||
					typeof payload.iat !== "number" ||
					typeof payload.exp !== "number" ||
					!Number.isInteger(payload.iat) ||
					!Number.isInteger(payload.exp) ||
					payload.iat > now + 60 ||
					payload.exp <= now ||
					payload.exp <= payload.iat ||
					!constantTimeStringEqual(payload.sub, config.username)
				) {
					return null;
				}

				return {
					username: payload.sub,
					issuedAt: payload.iat,
					expiresAt: payload.exp,
				};
			} catch {
				return null;
			}
		},
	};
}

export function readAuthSession(
	request: FastifyRequest,
	auth: AuthService,
): AuthSession | null {
	const signedCookie = request.cookies[auth.cookieName];
	if (!signedCookie) {
		return null;
	}

	const unsigned = request.unsignCookie(signedCookie);
	if (!unsigned.valid || !unsigned.value) {
		return null;
	}

	return auth.verifySession(unsigned.value);
}

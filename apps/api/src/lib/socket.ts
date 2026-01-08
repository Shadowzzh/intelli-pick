import { eventEmitter } from "@intellipick/events";
import type { FastifyInstance } from "fastify";
import fastifySocketIO from "fastify-socket.io";
import type { Socket as SocketIOSocket } from "socket.io";
import type { Server } from "socket.io";

interface ContentData {
	id: string;
	title?: string | null;
	summary?: string | null;
	url?: string | null;
	publishedAt?: Date | string | null;
	[key: string]: unknown;
}

interface EntityData {
	id: string;
	name: string;
	type: string;
	mentionCount?: number | null;
	lastMentionedAt?: Date | null;
	[key: string]: unknown;
}

interface StatsData {
	totalContents?: number;
	todayNew?: number;
	totalEntities?: number;
	[key: string]: unknown;
}

export interface ServerToClientEvents {
	"content:new": (data: ContentData) => void;
	"entity:updated": (data: EntityData) => void;
	"stats:updated": (data: StatsData) => void;
}

export interface ClientToServerEvents {
	"join:source": (sourceId: string) => void;
	"leave:source": (sourceId: string) => void;
}

declare module "fastify" {
	interface FastifyInstance {
		io: Server | null;
	}
}

let io: Server | null = null;

export async function initSocket(app: FastifyInstance) {
	await app.register(fastifySocketIO, {
		cors: {
			origin: process.env.WEB_URL || "http://localhost:5173",
			methods: ["GET", "POST"],
		},
		transports: ["websocket", "polling"],
	});

	// Access io through app.io after registration
	io = app.io;

	if (!io) {
		throw new Error("Socket.IO not initialized");
	}

	io.on("connection", (socket: SocketIOSocket) => {
		console.log("Client connected:", socket.id);

		socket.on("join:source", (sourceId: string) => {
			socket.join(`source:${sourceId}`);
		});

		socket.on("leave:source", (sourceId: string) => {
			socket.leave(`source:${sourceId}`);
		});

		socket.on("disconnect", () => {
			console.log("Client disconnected:", socket.id);
		});
	});

	// Listen for events from worker and broadcast to Socket.IO clients
	eventEmitter.on("content:new", (content) => {
		io?.emit("content:new", content);
	});

	eventEmitter.on("entity:updated", (entity) => {
		io?.emit("entity:updated", entity);
	});

	eventEmitter.on("stats:updated", (stats) => {
		io?.emit("stats:updated", stats);
	});

	console.log("Socket.IO server initialized");
	return io;
}

export function getSocket() {
	return io;
}

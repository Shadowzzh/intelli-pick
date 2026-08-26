import { type Socket, io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

type EventCallback = (...args: unknown[]) => void;

class SocketManager {
	private socket: Socket | null = null;
	private listeners = new Map<string, Set<EventCallback>>();

	connect() {
		if (this.socket?.connected) return;

		this.socket = io(SOCKET_URL, {
			transports: ["websocket"],
			withCredentials: true,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
		});

		this.socket.on("connect", () => {
			console.log("WebSocket connected");
		});

		this.socket.on("disconnect", (reason) => {
			console.log("WebSocket disconnected:", reason);
		});

		this.socket.on("reconnect", (attemptNumber) => {
			console.log("WebSocket reconnected:", attemptNumber);
		});

		// Forward events to registered listeners
		for (const [event, callbacks] of this.listeners) {
			this.socket?.on(event, (...args) => {
				for (const cb of callbacks) {
					cb(...args);
				}
			});
		}
	}

	disconnect() {
		this.socket?.disconnect();
		this.socket = null;
	}

	on(event: string, callback: EventCallback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.add(callback);
		}
		this.socket?.on(event, callback);
	}

	off(event: string, callback: EventCallback) {
		this.listeners.get(event)?.delete(callback);
		this.socket?.off(event, callback);
	}

	emit(event: string, ...args: unknown[]) {
		this.socket?.emit(event, ...args);
	}

	joinSource(sourceId: string) {
		this.emit("join:source", sourceId);
	}

	leaveSource(sourceId: string) {
		this.emit("leave:source", sourceId);
	}
}

export const socketManager = new SocketManager();

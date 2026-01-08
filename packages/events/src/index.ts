// Shared events package for worker-api communication
// This allows worker to emit events that will be broadcast via Socket.IO

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

type EventCallback = (...args: unknown[]) => void;

class EventEmitter {
	private listeners = new Map<string, Set<EventCallback>>();

	on(event: string, callback: EventCallback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.add(callback);
		}
	}

	off(event: string, callback: EventCallback) {
		this.listeners.get(event)?.delete(callback);
	}

	emit(event: string, ...args: unknown[]) {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			for (const callback of callbacks) {
				callback(...args);
			}
		}
	}
}

export const eventEmitter = new EventEmitter();

// Helper functions for worker to emit events
export function emitNewContent(content: ContentData) {
	eventEmitter.emit("content:new", content);
}

export function emitEntityUpdate(entity: EntityData) {
	eventEmitter.emit("entity:updated", entity);
}

export function emitStatsUpdate(stats: StatsData) {
	eventEmitter.emit("stats:updated", stats);
}

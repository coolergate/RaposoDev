import * as services from "@rbxts/services";

declare global {
	interface GameEventConnection {
		Unsub(): void;
	}
}

class GameEvent<ARGS extends unknown[]> {
	private connected_events = new Map<string, (...headers: ARGS) => void>();

	constructor() {}

	Connect(callback: (...args: ARGS) => void): GameEventConnection {
		const id = services.HttpService.GenerateGUID();
		const connected_events = this.connected_events;

		connected_events.set(id, callback);

		return {
			Unsub() {
				connected_events.delete(id);
			},
		};
	}

	Fire(...headers: ARGS) {
		for (const [id, callback] of this.connected_events) task.defer(() => callback(...headers));
	}

	Clear() {
		this.connected_events.clear();
	}
}

export default GameEvent;

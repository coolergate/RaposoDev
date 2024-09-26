/* -------------------------------------------------------------------------- */
/*                            Interfaces and types                            */

import GameEvent from "./event";

/* -------------------------------------------------------------------------- */
type TerminalVariableAttributes = "SAVE" | "HIDDEN" | "SERVER_ONLY" | "READONLY";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
export const map_TerminalCallbacks = new Map<string, TerminalCallback>();
export const map_TerminalVariables = new Map<string, TerminalVariable<unknown>>();

export const event_LogTerminal = new GameEvent<[content: string]>();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
export function TerminalLog(...content: unknown[]) {
	let str_FinalString = "";

	for (const entry of content) {
		str_FinalString += tostring(entry) + " ";
	}

	event_LogTerminal.Fire(str_FinalString);
}

export class TerminalVariable<T> {
	readonly defaultval: T;

	constructor(
		public readonly name: string,
		private value: T,
		public readonly attributes: TerminalVariableAttributes[],
		public readonly description = "undefined.",
	) {
		this.defaultval = value;

		map_TerminalVariables.set(name, this);
	}

	get() {
		return this.value as T;
	}

	set(newValue: T) {
		if (typeOf(newValue) !== typeOf(this.value))
			throw `TerminalValue expected: ${typeOf(this.value)}, got: ${typeOf(newValue)}`;

		this.value = newValue;
	}
}

export class TerminalCallback {
	constructor(
		public readonly name: string,
		private readonly callback: (user: Player, ...args: string[]) => string,
	) {
		map_TerminalCallbacks.set(name, this);
	}

	invoke(user: Player, ...args: string[]) {
		return this.callback(user, ...args);
	}
}

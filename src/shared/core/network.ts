import { HttpService, Players, RunService, Workspace } from "@rbxts/services";
import { t } from "@rbxts/t";
import UTIL_ReplicatedInst from "shared/util/replicatedinst";

/* -------------------------------------------------------------------------- */
/*                            Interfaces and types                            */
/* -------------------------------------------------------------------------- */
declare global {
	type FuncTypeCheck<T> = (value: unknown) => value is T;
	type ListTypeCheck<List extends unknown[]> = { [K in keyof List]: FuncTypeCheck<List[K]> };
}

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const set_SubscribedPlayers = new Set<Player>();

export const RemoteEvent = UTIL_ReplicatedInst(workspace, "RemoteEvent", "RemoteEvent");
export const RemoteFunction = UTIL_ReplicatedInst(workspace, "RemoteFunction", "RemoteFunction");
export const UnreliableRemoteEvent = UTIL_ReplicatedInst(workspace, "UnreliableRemoteEvent", "UnreliableRemoteEvent");

export const EngineRemoteFunction = UTIL_ReplicatedInst(workspace, "EngineRemoteFunction", "RemoteFunction");
export const EngineRemoteEvent = UTIL_ReplicatedInst(workspace, "EngineRemoteEvent", "RemoteEvent");

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
export function SubscribePlayer(inst: Player) {
	set_SubscribedPlayers.add(inst);
}

export function UnsubscribePlayer(inst: Player) {
	set_SubscribedPlayers.delete(inst);
}

export function InitializeNetworking() {
	if (RunService.IsServer()) {
		RemoteEvent.OnServerEvent.Connect((user, ...args) => {
			user.Kick(`Unauthorized request.`);

			const tostr = HttpService.JSONEncode(args);

			throw `UserId: ${user.UserId} attempted to call a RemoteEvent with the following args: ${tostr}`;
		});

		RemoteFunction.OnServerInvoke = (user: Player, id, ...args) => {
			if (!set_SubscribedPlayers.has(user) || !t.string(id)) return;

			const callback = NetworkFunction.map_NetFunctionsCallbacks.get(id);
			if (!callback) {
				throw `Attempt to call unknown callback "${id}" from user ${user.UserId}`;
			}

			return callback(user, ...args);
		};

		// TODO: Replace this with an appropriate login function
		EngineRemoteFunction.OnServerInvoke = (user) => {
			SubscribePlayer(user);
		};

		Players.PlayerRemoving.Connect((user) => UnsubscribePlayer(user));
	}

	if (RunService.IsClient()) {
		RemoteEvent.OnClientEvent.Connect((id, ...args) => {
			if (!t.string(id)) throw `Invalid NetworkEvent id: ${tostring(id)}`;

			const callback = NetworkEvent.map_NetEventsCallbacks.get(id);
			if (!callback) {
				throw `NetworkEvent "${id}" does not have a callback bound on the client or it doesn't exist.`;
			}

			callback(...(args as unknown[]));
		});
	}
}

export class NetworkEvent<A extends unknown[]> {
	static map_NetEvents = new Map<string, NetworkEvent<unknown[]>>();
	static map_NetEventsCallbacks = new Map<string, Callback>();

	constructor(private identifier: string) {
		NetworkEvent.map_NetEvents.set(identifier, this as unknown as NetworkEvent<unknown[]>);
	}

	WriteMessage(b_IsReliable: boolean, list_Players: Player[] | "ALL", list_Ignore: Player[]) {
		if (list_Players === "ALL") list_Players = Players.GetPlayers();

		for (let index = 0; index < list_Players.size(); index++) {
			const element = list_Players[index];
			if (!list_Ignore.includes(element)) continue;
			list_Players.remove(index);
		}

		return (...list_Data: A) => {
			if (RunService.IsClient()) {
				warn("NetworkEvent send function called from the client, ignoring...");
				print(debug.traceback("NetworkEvent traceback:", 1));
				return;
			}

			for (const user of list_Players as unknown as Player[]) {
				if (!set_SubscribedPlayers.has(user as Player)) continue;

				if (b_IsReliable) RemoteEvent.FireClient(user as Player, this.identifier, ...list_Data);
				else UnreliableRemoteEvent.FireClient(user as Player, this.identifier, ...list_Data);
			}
		};
	}

	SetClientRecieve(callback: (...args: A) => void) {
		NetworkEvent.map_NetEventsCallbacks.set(this.identifier, callback);
	}
}

export class NetworkFunction<A extends unknown[], R> {
	static map_NetFunctions = new Map<string, NetworkFunction<unknown[], unknown>>();
	static map_NetFunctionsCallbacks = new Map<string, Callback>();

	constructor(private identifier: string) {
		NetworkFunction.map_NetFunctions.set(identifier, this as NetworkFunction<unknown[], unknown>);
	}

	InvokeServer(...args: A) {
		if (RunService.IsServer()) throw `Function cannot be called from the server.`;

		return new Promise<R>((resolve, reject) => {
			const value = RemoteFunction.InvokeServer(this.identifier, ...args);
			resolve(value as R);
		});
	}

	SetServerCallback(callback: (user: Player, ...args: A) => R) {
		NetworkFunction.map_NetFunctionsCallbacks.set(this.identifier, callback);
	}
}

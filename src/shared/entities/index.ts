import { NetworkEvent, NetworkFunction } from "shared/core/network";
import BaseEntity from "./BaseEntity";
import { t } from "@rbxts/t";
import { RunService } from "@rbxts/services";
import { UTIL_GetTableDifference } from "shared/util/getdifference";

/* -------------------------------------------------------------------------- */
/*                            Interfaces and types                            */
/* -------------------------------------------------------------------------- */
declare global {
	type EntityType<T extends keyof Entities> = Entities[T]["prototype"];
}

type t_EntityReplication = {
	entclassname: keyof Entities;
	entid: string;
	construct_args: unknown[];
	content: Map<string, unknown>;
};

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const nete_EntityCreated = new NetworkEvent<[entityclass: keyof Entities, entityid: string, ...args: unknown[]]>(
	"ent_Created",
);
const nete_EntityDeleted = new NetworkEvent<[entityid: string]>("ent_Deleted");
const nete_EntityUpdated = new NetworkEvent<
	[id: string, classname: keyof Entities, content: Map<string, unknown>, build: unknown[]]
>("ent_Updated");
const netf_RequestEntities = new NetworkFunction<[], t_EntityReplication[]>("ent_Request");

const map_EntityConstructor = new Map<string, new (...args: unknown[]) => BaseEntity>();
const map_GameEntities = new Map<string, { construct_args: unknown[]; ent: BaseEntity }>();
const map_EntitiesReplicatedVariables = new Map<BaseEntity["id"], Map<string, unknown>>();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
export function CreateEntityByName<
	K extends keyof Entities,
	E extends Entities[K],
	C extends E extends new (...args: infer A) => BaseEntity ? A : never[],
>(name: K, customid?: string, ...args: C): EntityType<K> {
	const entity_constructor = map_EntityConstructor.get(name);
	if (!entity_constructor) throw `Unknown entity classname "${name}"`;

	const entity = new entity_constructor(...args);
	if (customid !== undefined) rawset(entity, "id", customid);

	map_GameEntities.set(entity.id, {
		construct_args: args,
		ent: entity,
	});

	if (RunService.IsServer())
		task.defer(() => {
			nete_EntityCreated.WriteMessage(true, "ALL", [])(entity.classname, entity.id, ...args); // Is this really needed?
		});

	return entity;
}

export function KillThisMafaker(entity: BaseEntity) {
	task.defer(() => {
		map_GameEntities.delete(entity.id);

		for (const callback of entity.list_OnDeletion) callback(entity);

		table.clear(entity);
	});
}

export function IsEntityOnMemoryOrImSchizo(entity: BaseEntity | string): boolean {
	if (!t.any(entity)) {
		return false;
	}

	if (t.string(entity)) {
		return map_GameEntities.has(entity);
	}

	for (const [id, info] of map_GameEntities) {
		if (entity.id !== id) continue;

		return info.ent === entity;
	}

	return false;
}

export function GetEntityFromId(entid: string) {
	return map_GameEntities.get(entid)?.ent;
}

export function GetEntitiesThatIsA<K extends keyof Entities, E extends Entities[K]>(classname: K): E["prototype"][] {
	const entities = new Array<E["prototype"]>();

	for (const [, info] of map_GameEntities) {
		if (!info.ent.IsA(classname)) continue;

		entities.push(info.ent as EntityType<K>);
	}

	return entities;
}

export function GetEntitiesFromInstance(inst: Instance) {
	const list_Entities = new Array<BaseEntity>();

	for (const [, info] of map_GameEntities) {
		if (!info.ent.list_AssociatedInstances.includes(inst)) {
			// Is it a descendant of one associated instance?
			for (const inst2 of info.ent.list_AssociatedInstances) {
				if (!inst.IsDescendantOf(inst2)) continue;
				list_Entities.push(info.ent);
				break;
			}

			continue;
		}

		list_Entities.push(info.ent);
	}

	return list_Entities;
}

export function InitializeEntitiesConstructor() {
	map_EntityConstructor.clear();

	for (const inst of script.GetChildren()) {
		if (!inst.IsA("ModuleScript") || inst.Name === "BaseEntity") continue;

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const content = require(inst) as new () => BaseEntity;
		if (!content || !t.table(content) || !t.function(rawget(content, "new"))) {
			throw `${inst} did not return a valid entity constructor. (${!t.table(content)}, ${!t.function(rawget(content, "new"))})`;
		}

		const name = tostring(content);
		if (name === "nil") {
			throw "Invalid naming scheme for " + tostring(inst);
		}

		map_EntityConstructor.set(name, content);
	}
}

function Client_GetReplicatedEntityById(classname: keyof Entities, id: string, ...args: unknown[]) {
	let entity = GetEntityFromId(id);
	if (!entity || !entity.IsA(classname)) {
		if (map_GameEntities.has(id)) map_GameEntities.delete(id);

		// What a fucking disgusting bypass
		entity = CreateEntityByName(classname, id, ...(args as never[])) as BaseEntity;
	}

	return entity;
}

export function ReplicateEntity(entity: BaseEntity, players: "ALL" | Player[], ignore: Player[] = []) {
	if (!RunService.IsServer()) return;

	const info = map_GameEntities.get(entity.id);
	if (!info) throw `Entity is unknown or is not on memory.`;

	const values = entity.GetReplicatedVaribles();

	nete_EntityUpdated.WriteMessage(true, players, ignore)(entity.id, entity.classname, values, info.construct_args);
}
export function ReplicateEntitySpecific<E extends BaseEntity, K extends keyof E>(
	entity: E,
	variables: K[],
	players: "ALL" | Player[],
	ignore: Player[] = [],
) {
	if (!RunService.IsServer()) return;

	const info = map_GameEntities.get(entity.id);
	if (!info) throw `Entity is unknown or is not on memory.`;

	const values = entity.GetReplicatedVaribles();

	for (const [key] of values) {
		if (variables.includes(key as K)) continue;

		values.delete(key);
	}

	nete_EntityUpdated.WriteMessage(true, players, ignore)(entity.id, entity.classname, values, info.construct_args);
}

export function FetchReplicatedEntities() {
	for (const info of netf_RequestEntities.InvokeServer().expect()) {
		const ent = Client_GetReplicatedEntityById(info.entclassname, info.entid, ...info.construct_args);

		for (const [key, value] of info.content) {
			rawset(ent, key, value);
		}
	}
}

export function UpdateNetworkedEntitiesVariables() {
	if (!RunService.IsServer()) return;

	// Check if entities are still in the game world
	for (const [id, content] of map_EntitiesReplicatedVariables) {
		if (IsEntityOnMemoryOrImSchizo(id)) continue;

		content.clear();
		map_EntitiesReplicatedVariables.delete(id);
	}

	// Update on the server-side
	for (const [id, info] of map_GameEntities) {
		const map_CurrentEntityContent = info.ent.GetReplicatedVaribles();
		let map_LoggedEntityContent = map_EntitiesReplicatedVariables.get(id);

		if (!map_LoggedEntityContent) {
			map_LoggedEntityContent = map_CurrentEntityContent;
			map_EntitiesReplicatedVariables.set(id, map_LoggedEntityContent);
		}

		if (UTIL_GetTableDifference(map_CurrentEntityContent, map_LoggedEntityContent)) {
			nete_EntityUpdated.WriteMessage(true, "ALL", [])(
				id,
				info.ent.classname,
				map_CurrentEntityContent,
				info.construct_args,
			);
		}
	}
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */
nete_EntityCreated.SetClientRecieve((classname, entityid, ...args) => {
	Client_GetReplicatedEntityById(classname, entityid, ...args);
});

nete_EntityUpdated.SetClientRecieve((entityid, classname, content, build) => {
	const entity = Client_GetReplicatedEntityById(classname, entityid, ...build);

	for (const [key, value] of content) {
		rawset(entity, key, value);
	}
});

nete_EntityDeleted.SetClientRecieve((entityid) => {
	if (!IsEntityOnMemoryOrImSchizo(entityid)) return;

	const entinfo = map_GameEntities.get(entityid);
	if (!entinfo) return;

	KillThisMafaker(entinfo.ent);
});

netf_RequestEntities.SetServerCallback((user) => {
	const list_Entities = new Array<t_EntityReplication>();

	for (const [entityid, info] of map_GameEntities) {
		const buildlist = info.construct_args;
		const content = info.ent.GetReplicatedVaribles();

		list_Entities.push({
			entclassname: info.ent.classname,
			entid: entityid,
			construct_args: buildlist,
			content: content,
		});
	}

	return list_Entities;
});

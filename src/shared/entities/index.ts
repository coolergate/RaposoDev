import { NetworkEvent } from "shared/core/network";
import BaseEntity from "./BaseEntity";
import { t } from "@rbxts/t";
import { RunService } from "@rbxts/services";

/* -------------------------------------------------------------------------- */
/*                            Interfaces and types                            */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
/* eslint-disable prettier/prettier */
const nete_EntityCreated = new NetworkEvent<[entityclass: keyof Entities, entityid: string]>("ent_Created");
const nete_EntityDeleted = new NetworkEvent<[entityid: string]>("ent_Deleted");
const nete_EntityUpdated = new NetworkEvent<[id: string, classname: keyof Entities, content: Map<string, unknown>]>("ent_Updated");

const map_EntityConstructor = new Map<string, new () => BaseEntity>();
const map_GameEntities = new Map<string, BaseEntity>();
/* eslint-enable prettier/prettier */

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
export function CreateEntityByName<K extends keyof Entities, E extends Entities[K]>(name: K, customid?: string): E {
	const entity_constructor = map_EntityConstructor.get(name);
	if (!entity_constructor) throw `Unknown entity classname "${name}"`;

	const entity = new entity_constructor();
	if (customid !== undefined) rawset(entity, "id", customid);

	map_GameEntities.set(entity.id, entity);

	if (RunService.IsServer())
		task.defer(() => {
			// nete_EntityCreated.WriteMessage(true, "ALL", [])(entity.classname, entity.id); // Is this really needed?
			nete_EntityUpdated.WriteMessage(true, "ALL", [])(
				entity.id,
				entity.classname,
				entity.GetReplicatedVaribles(),
			);
		});

	return entity as E;
}

export function DestroyEntity(entity: BaseEntity) {
	task.defer(() => {
		map_GameEntities.delete(entity.id);

		for (const callback of entity.list_OnDeletion) callback(entity);

		table.clear(entity);
	});
}

export function IsEntityOnMemory(entity: BaseEntity | string): boolean {
	if (!t.any(entity)) {
		return false;
	}

	if (t.string(entity)) {
		return map_GameEntities.has(entity);
	}

	for (const [id, ent] of map_GameEntities) {
		if (entity.id !== id) continue;

		return ent === entity;
	}

	return false;
}

export function GetEntityFromId(entid: string) {
	return map_GameEntities.get(entid);
}

export function GetEntitiesWhichIsA<K extends keyof Entities, E extends Entities[K]>(classname: K): E[] {
	const entities = new Array<E>();

	for (const [, entity] of map_GameEntities) {
		if (!entity.IsA(classname)) continue;

		entities.push(entity as E);
	}

	return entities;
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

function Client_GetReplicatedEntityById(classname: keyof Entities, id: string) {
	let entity = GetEntityFromId(id);
	if (!entity || !entity.IsA(classname)) {
		if (map_GameEntities.has(id)) map_GameEntities.delete(id);

		entity = CreateEntityByName(classname, id) as BaseEntity;
	}

	return entity;
}

export function ReplicateEntity(entity: BaseEntity, players: "ALL" | Player[], ignore: Player[] = []) {
	if (!RunService.IsServer()) return;

	const values = entity.GetReplicatedVaribles();

	nete_EntityUpdated.WriteMessage(true, players, ignore)(entity.id, entity.classname, values);
}
export function ReplicateEntitySpecific<E extends BaseEntity, K extends keyof E>(
	entity: E,
	variables: K[],
	players: "ALL" | Player[],
	ignore: Player[] = [],
) {
	if (!RunService.IsServer()) return;

	const values = entity.GetReplicatedVaribles();

	for (const [key] of values) {
		if (variables.includes(key as K)) continue;

		values.delete(key);
	}

	nete_EntityUpdated.WriteMessage(true, players, ignore)(entity.id, entity.classname, values);
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */
nete_EntityCreated.SetClientRecieve((classname, entityid) => {
	Client_GetReplicatedEntityById(classname, entityid);
});

nete_EntityUpdated.SetClientRecieve((entityid, classname, content) => {
	const entity = Client_GetReplicatedEntityById(classname, entityid);

	for (const [key, value] of content) {
		rawset(entity, key, value);
	}
});

nete_EntityDeleted.SetClientRecieve((entityid) => {
	if (!IsEntityOnMemory(entityid)) return;

	const entity = map_GameEntities.get(entityid);
	if (!entity) return;

	DestroyEntity(entity);
});

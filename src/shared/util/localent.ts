import { RunService } from "@rbxts/services";
import GameController from "shared/controllers/prefab/GameController";
import { GetEntityFromId } from "shared/entities";

function UTIL_GetLocalEntity() {
	if (!RunService.IsClient()) return;

	const ent_UserEntity = GameController.UserEntity;

	const entity = GetEntityFromId(ent_UserEntity.CurrentCharacterId);
	if (!entity || !entity.IsA("CharacterEntity")) return;

	return entity;
}

export = UTIL_GetLocalEntity;

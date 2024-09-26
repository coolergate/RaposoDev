import { New } from "@rbxts/fusion";
import { RunService } from "@rbxts/services";
import GameController from "shared/controllers/prefab/GameController";
import { envfolders } from "shared/map";

if (RunService.IsClient())
	New("Part")({
		Anchored: true,
		Position: new Vector3(),
		Size: new Vector3(300, 1, 300),
		Parent: envfolders.parts,
	});

if (RunService.IsClient()) {
	GameController.Controllers.CharacterController.RespawnRequest().expect();

	task.wait(2);

	const entity = GameController.UserEntity.GetCharacter();
	if (!entity) throw `WHAT!`;

	GameController.Controllers.CameraController.ent_Target = entity;
	entity.Respawn();
}

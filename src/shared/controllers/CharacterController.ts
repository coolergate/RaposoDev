import { NetworkEvent, NetworkFunction } from "shared/core/network";
import GameController from "./prefab/GameController";
import { CreateEntityByName, ReplicateEntity } from "shared/entities";
import { RunService } from "@rbxts/services";
import { TerminalCallback } from "shared/termvars";

declare global {
	interface Controllers {
		CharacterController: (typeof CharacterController)["prototype"];
	}
}

class CharacterController extends GameController {
	netf_RespawnChar = new NetworkFunction("char_respawn");

	constructor() {
		super("CharacterController");

		new TerminalCallback("respawn", () => {
			this.RespawnRequest();
			return "";
		});
	}

	OnStart(): void {
		this.netf_RespawnChar.SetServerCallback((user) => {
			const ent_UserEntity = GameController.Controllers.PlayerController.GetUserEntityFromPlayer(user);
			if (!ent_UserEntity) return;

			const ent_CurrentCharacter = ent_UserEntity.GetCharacter();
			if (ent_CurrentCharacter) return;

			const ent_NewCharacter = CreateEntityByName("CharacterEntity");
			ent_NewCharacter.owner = ent_UserEntity.id;

			ReplicateEntity(ent_NewCharacter, "ALL");

			task.wait(0.25); // Yes, this is on purpose (to which I don't know of...)

			ent_UserEntity.CurrentCharacterId = ent_NewCharacter.id;
		});
	}

	RespawnRequest() {
		if (!RunService.IsClient()) throw `Function cannot be called from the server.`;

		return this.netf_RespawnChar.InvokeServer();
	}
}

export = CharacterController;

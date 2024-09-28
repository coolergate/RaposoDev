import { NetworkEvent, NetworkFunction } from "shared/core/network";
import GameController from "./prefab/GameController";
import { Players, RunService } from "@rbxts/services";
import { t } from "@rbxts/t";
import { CreateEntityByName, KillThisMafaker, GetEntityFromId, ReplicateEntity } from "shared/entities";
import UserEntity from "shared/entities/UserEntity";

declare global {
	interface Controllers {
		PlayerController: (typeof PlayerController)["prototype"];
	}
}

class PlayerController extends GameController {
	private netf_PlayerLogin = new NetworkFunction<[], string>("plr_login");

	private map_PlayersData = new Map<number, UserEntity["id"]>();
	private set_LoggedPlayers = new Set<Player["UserId"]>();

	constructor() {
		super("PlayerController");

		this.netf_PlayerLogin.SetServerCallback((user) => {
			if (this.map_PlayersData.has(user.UserId)) {
				user.Kick(`Unauthorized callback.`); // what?
				return "";
			}

			print(user, "Login request!");

			this.set_LoggedPlayers.add(user.UserId);

			// Create user entity
			const ent_UserEntity = CreateEntityByName("UserEntity", undefined, user);

			this.map_PlayersData.set(user.UserId, ent_UserEntity.id);

			// Share with the world
			ReplicateEntity(ent_UserEntity, "ALL");

			task.wait(1);

			return ent_UserEntity.id;
		});

		Players.PlayerRemoving.Connect((user) => {
			const ent_UserEntity = this.GetUserEntityFromPlayer(user);
			if (!ent_UserEntity) return;

			const ent_Character = ent_UserEntity.GetCharacter();
			if (ent_Character) KillThisMafaker(ent_Character);
		});
	}

	LoginRequest() {
		if (!RunService.IsClient()) return;

		return this.netf_PlayerLogin.InvokeServer().expect();
	}

	GetUserEntityFromPlayer(user: Player) {
		const entid = this.map_PlayersData.get(user.UserId);
		if (!entid) return;

		const ent_UserEntity = GetEntityFromId(entid);
		if (!ent_UserEntity?.IsA("UserEntity")) return;

		return ent_UserEntity;
	}
}

export = PlayerController;

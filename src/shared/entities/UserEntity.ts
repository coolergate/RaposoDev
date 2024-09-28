import { Players, RunService } from "@rbxts/services";
import BaseEntity from "./BaseEntity";
import { GetEntityFromId, ReplicateEntity } from ".";

declare global {
	interface Entities {
		UserEntity: typeof UserEntity;
	}

	type UserButtons = EntityType<"UserEntity">["buttons"];
}

class UserEntity extends BaseEntity {
	CurrentCharacterId = "";
	private LastCharacterId = this.CurrentCharacterId;

	buttons = {
		attack1: false,
		attack2: false,
		reload: false,

		sprint: false,
		jump: false,
		crouch: false,
		wishdir: new Vector3(),

		// TODO: Finish these ones:
		zoom: false,
		voice: false,
	};

	constructor(public readonly PlayerInstance: Player) {
		super();

		this.classname = "UserEntity";
		this.set_IsA.add("UserEntity");

		this.RegisterReplicatedValue("PlayerInstance");
		this.RegisterReplicatedValue("CurrentCharacterId");
	}

	GetCharacter() {
		const entity = GetEntityFromId(this.CurrentCharacterId);
		if (!entity?.IsA("CharacterEntity")) return;

		return entity;
	}

	Think() {
		if (this.CurrentCharacterId !== this.LastCharacterId) {
			if (RunService.IsServer()) {
				const entity = GetEntityFromId(this.CurrentCharacterId);
				if (!entity?.IsA("CharacterEntity")) this.CurrentCharacterId = "";
			}

			this.LastCharacterId = this.CurrentCharacterId;

			if (RunService.IsServer()) {
				ReplicateEntity(this, "ALL");
				print("Synchronized.");
			}
		}
	}
}

export = UserEntity;

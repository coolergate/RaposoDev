import { RunService } from "@rbxts/services";
import GameController from "./prefab/GameController";
import { NetworkEvent } from "shared/core/network";
import { storage } from "shared/util/envfolders";
import { GetEntityFromId } from "shared/entities";
import UTIL_GetFirstDescendant from "shared/util/getdescendant";
import { TerminalLog } from "shared/termvars";
import UTIL_GetLocalEntity from "shared/util/localent";

declare global {
	interface Controllers {
		SoundController: (typeof SoundController)["prototype"];
	}
}

class SoundPool {
	list_Instances = new Array<{ attach: Attachment; snd: Sound }>();

	constructor(private str_OriginalSoundName: string) {
		this.ReserveMoreSounds();
	}

	ReserveMoreSounds() {
		const inst_OriginalSoundInst = UTIL_GetFirstDescendant(storage.sounds, this.str_OriginalSoundName, "Sound");
		if (!inst_OriginalSoundInst) throw `Could not find sound instance: ${this.str_OriginalSoundName}`;

		for (let i = 0; i < 10; i++) {
			const attach = new Instance("Attachment");
			attach.Name = "SoundAttachment";
			attach.Parent = workspace.Terrain;

			const inst_Cloned = inst_OriginalSoundInst.Clone();
			inst_Cloned.Parent = attach;

			this.list_Instances.push({ attach: attach, snd: inst_Cloned });
		}
	}

	GetAvailableInstance(): { attach: Attachment; snd: Sound } {
		let inst_SelectedSound: { attach: Attachment; snd: Sound } | undefined;

		for (const sound of this.list_Instances) {
			if (sound.snd.IsPlaying) continue;

			inst_SelectedSound = sound;
			break;
		}

		if (!inst_SelectedSound) {
			this.ReserveMoreSounds();

			inst_SelectedSound = this.GetAvailableInstance();
		}

		return inst_SelectedSound;
	}
}

class SoundController extends GameController {
	private netm_PlaySound = new NetworkEvent<[name: string]>("sound_PlaySound");
	private netm_PlayWorldSound = new NetworkEvent<[name: string, position: Vector3]>("sound_PlayWorldSound");
	private netm_PlayEntitySound = new NetworkEvent<[name: string, entityid: string]>("sound_PlayEntitySound");

	map_AvailableSoundInstances = new Map<string, SoundPool>();
	private map_FollowingEntities = new Map<Entities["WorldEntity"]["id"], Array<{ attach: Attachment; snd: Sound }>>();

	constructor() {
		super("SoundController");

		// Client preload
		if (RunService.IsClient()) {
			for (const inst of storage.sounds.GetDescendants()) {
				if (!inst.IsA("Sound")) continue;

				const pool = new SoundPool(inst.Name);
				this.map_AvailableSoundInstances.set(inst.Name, pool);
			}
		}

		this.netm_PlayEntitySound.SetClientRecieve((name, entityid) => {
			const entity = GetEntityFromId(entityid);
			if (!entity || !entity.IsA("WorldEntity")) return;

			this.PlayEntitySound(name, entity);
		});
		this.netm_PlayWorldSound.SetClientRecieve((name, pos) => this.PlayWorldSound(name, pos));
		this.netm_PlaySound.SetClientRecieve((name) => this.PlaySound(name));
	}

	private Handler(inst: Sound) {
		return {
			soundinst: inst,

			Stop() {
				inst.Stop();
			},
		};
	}

	PlayEntitySound(
		name: string,
		entity: Entities["WorldEntity"],
		users: Player[] | "ALL" = "ALL",
		ignore: Player[] = [],
	) {
		if (RunService.IsServer()) {
			this.netm_PlayEntitySound.WriteMessage(true, users, ignore)(name, entity.id);

			return;
		}

		const pool = this.map_AvailableSoundInstances.get(name);
		if (!pool) {
			TerminalLog("ERROR", `Unknown sound: ${name}`);
			return;
		}

		const inst = pool.GetAvailableInstance();

		inst.attach.Position = entity.origin;
		inst.snd.Play();

		const list = this.map_FollowingEntities.get(entity.id) || new Array();
		list.push(inst);

		this.map_FollowingEntities.set(entity.id, list);

		return this.Handler(inst.snd);
	}

	PlayWorldSound(name: string, position: Vector3, users: Player[] | "ALL" = "ALL", ignore: Player[] = []) {
		if (RunService.IsServer()) {
			this.netm_PlayWorldSound.WriteMessage(true, users, ignore)(name, position);

			return;
		}

		const pool = this.map_AvailableSoundInstances.get(name);
		if (!pool) {
			TerminalLog("ERROR", `Unknown sound: ${name}`);
			return;
		}

		const inst = pool.GetAvailableInstance();

		inst.attach.Position = position;
		inst.snd.Play();

		return this.Handler(inst.snd);
	}

	PlaySound(name: string, users: Player[] | "ALL" = "ALL", ignore: Player[] = []) {
		if (RunService.IsServer()) {
			this.netm_PlaySound.WriteMessage(true, users, ignore)(name);

			return;
		}

		const entity = UTIL_GetLocalEntity();
		if (!entity) return;

		const pool = this.map_AvailableSoundInstances.get(name);
		if (!pool) {
			TerminalLog("ERROR", `Unknown sound: ${name}`);
			return;
		}

		const inst = pool.GetAvailableInstance();
		inst.snd.Play();

		const list = this.map_FollowingEntities.get(entity.id) || new Array();
		list.push(inst);

		this.map_FollowingEntities.set(entity.id, list);
	}

	LateUpdate(dt: number): void {
		for (const [entid, instlist] of this.map_FollowingEntities) {
			const entity = GetEntityFromId(entid);

			if (instlist.size() <= 0) {
				this.map_FollowingEntities.delete(entid);
				continue;
			}

			for (let index = 0; index < instlist.size(); index++) {
				const element = instlist[index];
				if (!element) continue;

				if (!element?.snd.IsPlaying || !entity || !entity.IsA("WorldEntity")) {
					instlist.remove(index);
					element.snd?.Stop();
					continue;
				}

				element.attach.Position = entity.IsA("CharacterEntity")
					? entity.GetViewPosition().Position
					: entity.origin;
			}
		}
	}
}

export = SoundController;

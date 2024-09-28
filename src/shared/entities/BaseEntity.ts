import { HttpService } from "@rbxts/services";

declare global {
	interface Entities {
		BaseEntity: typeof BaseEntity;
	}
}

abstract class BaseEntity {
	readonly id: string = HttpService.GenerateGUID(true);

	classname: keyof Entities = "BaseEntity";
	protected set_IsA = new Set<keyof Entities>();
	private set_ReplicatedValues = new Set<string>();
	readonly list_OnClientSync = new Array<Callback>();
	readonly list_OnDeletion = new Array<Callback>();
	readonly list_AssociatedInstances = new Array<Instance>();

	constructor() {
		this.set_IsA.add("BaseEntity");
	}

	IsA<C extends keyof Entities>(classname: C): this is EntityType<C> {
		return this.set_IsA.has(classname);
	}

	GetReplicatedVaribles() {
		const map_ReplicatedValues = new Map<string, unknown>();

		for (const [key, value] of this as unknown as Map<string, unknown>) {
			if (!this.set_ReplicatedValues.has(key)) continue;

			map_ReplicatedValues.set(key, value);
		}

		return map_ReplicatedValues;
	}

	Think(dt: number) {}
	OnDelete(callback: (entity: this) => void) {
		this.list_OnDeletion.push(callback);
	}
	OnClientSync(callback: (entity: this) => void) {
		this.list_OnClientSync.push(callback);
	}

	AssociateInstance(inst: Instance) {
		this.list_AssociatedInstances.push(inst);
	}

	protected readonly RegisterReplicatedValue = (key: keyof this) => this.set_ReplicatedValues.add(key as string);
	protected readonly RemoveReplicatedValue = (key: keyof this) => this.set_ReplicatedValues.delete(key as string);
}

export = BaseEntity;

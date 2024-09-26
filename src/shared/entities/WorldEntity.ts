import BaseEntity from "./BaseEntity";

declare global {
	interface Entities {
		WorldEntity: (typeof WorldEntity)["prototype"];
	}
}

class WorldEntity extends BaseEntity {
	origin = new Vector3();
	angles = new Vector3(0, 0, -1);
	velocity = new Vector3();
	size = new Vector3();

	constructor() {
		super();

		this.classname = "WorldEntity";
		this.set_IsA.add("WorldEntity");

		this.RegisterReplicatedValue("origin");
		this.RegisterReplicatedValue("angles");
		this.RegisterReplicatedValue("velocity");
		this.RegisterReplicatedValue("size");
	}
}

export = WorldEntity;

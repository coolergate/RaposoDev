import WorldEntity from "./WorldEntity";

declare global {
	interface Entities {
		HealthEntity: (typeof HealthEntity)["prototype"];
	}
}

class HealthEntity extends WorldEntity {
	health = 100;
	maxhealth = 100;

	constructor() {
		super();

		this.classname = "HealthEntity";
		this.set_IsA.add("HealthEntity");

		this.RegisterReplicatedValue("health");
		this.RegisterReplicatedValue("maxhealth");
	}
}

export = HealthEntity;

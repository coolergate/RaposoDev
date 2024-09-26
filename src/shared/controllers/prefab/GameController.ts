import UserEntity from "shared/entities/UserEntity";

class GameController {
	static Controllers: { [K in keyof Controllers]: Controllers[K] } = {} as typeof GameController.Controllers; // WHAT KIND OF TRICKERY IS THIS
	static UserEntity: UserEntity;

	constructor(name: keyof Controllers) {
		rawset(GameController.Controllers, name, this);
	}

	OnStart() {}

	Update(dt: number) {}
	FixedUpdate(dt: number) {}
	LateUpdate(dt: number) {}

	OnDisconnect() {}
}

export = GameController;

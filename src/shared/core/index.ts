import { ReplicatedStorage, RunService } from "@rbxts/services";
import { t } from "@rbxts/t";
import GameController from "shared/controllers/prefab/GameController";
import { GetEntitiesThatIsA, GetEntityFromId, UpdateNetworkedEntitiesVariables } from "shared/entities";
import UTIL_UTC_Time from "shared/util/utctime";

/* -------------------------------------------------------------------------- */
/*                            Interfaces and types                            */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const folder_ControllersFolder = ReplicatedStorage.WaitForChild("shared").WaitForChild("controllers");

/* --------------------------- Game loop variables -------------------------- */
const n_Tickrate = 1 / 24;

const list_TickCallback = new Array<(dt: number) => void>();
const list_FrameCallback = new Array<(dt: number) => void>();

let n_NextUpdateTime = 0;
let n_LastUpdateTime = 0;

let n_CurrentDeltaTime = 0;
let n_CurrentFixedDeltaTime = 0;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
export function InitializeControllers() {
	const controllers = folder_ControllersFolder.GetChildren();

	for (const inst of controllers) {
		if (!inst.IsA("ModuleScript")) continue;

		const class_constructor = require(inst) as new () => GameController;
		if (!t.any(class_constructor) || !t.callback(rawget(class_constructor, "new"))) {
			throw `${inst.Name} did not return a valid class constructor...`;
		}

		new class_constructor();
	}

	if (RunService.IsClient()) {
		const ent_UserEntity = GetEntityFromId(GameController.Controllers.PlayerController.LoginRequest()!);
		if (!ent_UserEntity || !ent_UserEntity.IsA("UserEntity"))
			throw `Returned entity id is not an user entity, ${ent_UserEntity !== undefined}`;

		GameController.UserEntity = ent_UserEntity;
	}

	for (const [, controller] of GameController.Controllers as unknown as Map<string, GameController>) {
		task.defer(() => controller.OnStart());
	}
}

export function BindTickStep(callback: (dt: number) => void) {
	list_TickCallback.push(callback);
}
export function BindFrameStep(callback: (dt: number) => void) {
	list_FrameCallback.push(callback);
}

export function InitLifecycle() {
	// get the next exact second and start the timer
	const n_CurrentTime = UTIL_UTC_Time();
	n_NextUpdateTime = n_CurrentTime + math.round(n_CurrentTime + 2) - n_CurrentTime;
	n_LastUpdateTime = n_CurrentTime;

	if (RunService.IsServer()) RunService.Heartbeat.Connect((dt) => Update(dt));
	else RunService.BindToRenderStep("updatecycle", -99, (dt) => Update(dt));
}

function Update(dt: number) {
	const current_time = UTIL_UTC_Time();

	n_CurrentDeltaTime = 0;
	n_CurrentFixedDeltaTime = current_time - n_LastUpdateTime;

	// Update controllers
	const controllers = GameController.Controllers as unknown as Map<string, GameController>;

	for (const [name, comp] of controllers) comp.Update(dt);

	if (current_time >= n_NextUpdateTime) {
		for (const callback of list_TickCallback) callback(current_time - n_LastUpdateTime);

		// Update controllers (again)
		for (const [name, comp] of controllers) comp.FixedUpdate(current_time - n_LastUpdateTime);

		// Update entities
		for (const entity of GetEntitiesThatIsA("BaseEntity")) entity.Think(current_time - n_LastUpdateTime);

		n_NextUpdateTime = n_LastUpdateTime + n_Tickrate;
		n_LastUpdateTime = current_time;
	}

	// Update frame bindings
	for (const bind of list_FrameCallback) bind(dt);

	// Update controllers (yet again)
	for (const [name, comp] of controllers) comp.LateUpdate(dt);

	// Update entities sync
	UpdateNetworkedEntitiesVariables();
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */

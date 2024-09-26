import { GuiService, UserInputService } from "@rbxts/services";
import GameController from "shared/controllers/prefab/GameController";
import { BindFrameStep } from "shared/core";
import { TerminalCallback } from "shared/termvars";
import { ConvertCF_V2, ConvertV2_CF } from "shared/util/mathconversion";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const map_v2_MovementRequest = new Map<string, Vector2>();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
new TerminalCallback("+forward", () => {
	map_v2_MovementRequest.set("forward", new Vector2(0, -1));
	return "";
});
new TerminalCallback("-forward", () => {
	map_v2_MovementRequest.delete("forward");
	return "";
});

new TerminalCallback("+back", () => {
	map_v2_MovementRequest.set("back", new Vector2(0, 1));
	return "";
});
new TerminalCallback("-back", () => {
	map_v2_MovementRequest.delete("back");
	return "";
});

new TerminalCallback("+left", () => {
	map_v2_MovementRequest.set("left", new Vector2(-1, 0));
	return "";
});
new TerminalCallback("-left", () => {
	map_v2_MovementRequest.delete("left");
	return "";
});

new TerminalCallback("+right", () => {
	map_v2_MovementRequest.set("right", new Vector2(1, 0));
	return "";
});
new TerminalCallback("-right", () => {
	map_v2_MovementRequest.delete("right");
	return "";
});

/* -------------------- Jumping, crouching and sprinting -------------------- */
new TerminalCallback("+jump", () => {
	GameController.UserEntity.buttons.jump = true;
	return "";
});
new TerminalCallback("-jump", () => {
	GameController.UserEntity.buttons.jump = false;
	return "";
});

new TerminalCallback("+crouch", () => {
	GameController.UserEntity.buttons.crouch = true;
	return "";
});
new TerminalCallback("-crouch", () => {
	GameController.UserEntity.buttons.crouch = false;
	return "";
});

function GetMovementInputDirection() {
	let v2_InputDirection = new Vector2();

	for (const [cmd, dir] of map_v2_MovementRequest) v2_InputDirection = v2_InputDirection.add(dir);
	if (v2_InputDirection.Magnitude > 0) v2_InputDirection = v2_InputDirection.Unit;
	return v2_InputDirection;
}

function GetWishDirection(vertical_enabled = false) {
	// world direction
	let cam_worlddir = new CFrame();
	// const [, camera_y] = ConvertDirectionCF().ToOrientation();
	const [, camera_y] = workspace.CurrentCamera!.CFrame.ToOrientation();
	cam_worlddir = new CFrame().mul(CFrame.Angles(0, camera_y, 0));

	if (vertical_enabled) cam_worlddir = workspace.CurrentCamera!.CFrame;

	const input = GetMovementInputDirection();

	const world_direction = cam_worlddir.VectorToWorldSpace(new Vector3(input.X, 0, input.Y));
	return world_direction.Magnitude > 0 && GuiService.MenuIsOpen === false ? world_direction.Unit : Vector3.zero;
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */

BindFrameStep((dt) => {
	const userent = GameController.UserEntity;
	if (!userent) return;

	const entity = userent.GetCharacter();
	if (!entity) return;

	const delta = GameController.Controllers.InputController.GetInputDelta();

	const cf_CurrentOrientation = entity.GetViewPosition();

	const v2_CurrentRotation = ConvertCF_V2(cf_CurrentOrientation);

	const v2_NewRotation = new Vector2(
		v2_CurrentRotation.X - delta.X,
		math.clamp(v2_CurrentRotation.Y - delta.Y, -80, 80),
	);
	const cf_NewRotation = ConvertV2_CF(v2_NewRotation);

	entity.angles = cf_NewRotation.LookVector;
	userent.buttons.wishdir = GetWishDirection();
});

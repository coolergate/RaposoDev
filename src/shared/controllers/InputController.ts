import { GuiService, RunService, UserInputService } from "@rbxts/services";
import GameController from "./prefab/GameController";
import { map_InputBoundCommands, obj_UserGameSettings } from "shared/userconfig";
import { UTIL_ISMOBILE } from "shared/util/platform";

declare global {
	interface Controllers {
		InputController: (typeof InputController)["prototype"];
	}
}

class InputController extends GameController {
	constructor() {
		super("InputController");

		if (RunService.IsClient()) {
			UserInputService.InputBegan.Connect((input, busy) => {
				if (busy) return;

				const name = input.KeyCode.Name !== "Unknown" ? input.KeyCode.Name : input.UserInputType.Name;
				const command = map_InputBoundCommands.get(name);

				if (!command) return;

				GameController.Controllers.TerminalController.Execute(command);
			});

			UserInputService.InputEnded.Connect((input, busy) => {
				if (busy) return;

				const name = input.KeyCode.Name !== "Unknown" ? input.KeyCode.Name : input.UserInputType.Name;
				const command = map_InputBoundCommands.get(name);

				if (!command) return;

				// Check to see if the command has a plus sign as the first character
				// if so, swap if for the negative one.
				let newcommand = command;
				if (command.sub(1, 1) === "+") newcommand = "-" + command.sub(2);

				GameController.Controllers.TerminalController.Execute(newcommand);
			});
		}
	}

	GetGamepad() {
		return UserInputService.GetGamepadState(Enum.UserInputType.Gamepad1);
	}

	GetThumbstick1() {
		const input = this.GetGamepad().find(
			(obj) => obj.KeyCode.Name === (!obj_UserGameSettings.joy_flipsticks.get() ? "Thumbstick1" : "Thumbstick2"),
		);

		return input?.Position;
	}

	GetThumbstick2() {
		const input = this.GetGamepad().find(
			(obj) => obj.KeyCode.Name === (!obj_UserGameSettings.joy_flipsticks.get() ? "Thumbstick2" : "Thumbstick1"),
		);

		return input?.Position;
	}

	GetInputDelta() {
		const v3_GamepadInput = this.GetThumbstick2();
		const v2_GamepadDirection = new Vector2(v3_GamepadInput?.X, v3_GamepadInput?.Y).mul(new Vector2(1, -1));

		return GuiService.MenuIsOpen === false && GameController.Controllers.CameraController.set_MouseUnlock.isEmpty()
			? new Vector2()
					.add(!UTIL_ISMOBILE() ? UserInputService.GetMouseDelta().mul(0.75) : new Vector2())
					.add(
						v2_GamepadDirection.Magnitude > 0.05
							? v2_GamepadDirection.mul(UserSettings().GameSettings.MouseSensitivity).mul(5)
							: new Vector2(),
					)
					.mul(new Vector2(1, UserSettings().GameSettings.GetCameraYInvertValue()))
			: Vector2.zero;
	}
}

export = InputController;

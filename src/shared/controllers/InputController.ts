import { RunService, UserInputService } from "@rbxts/services";
import GameController from "./prefab/GameController";
import { map_InputBoundCommands } from "shared/userconfig";

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
}

export = InputController;

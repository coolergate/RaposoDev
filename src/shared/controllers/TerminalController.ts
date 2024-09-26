import { event_LogTerminal, map_TerminalCallbacks, map_TerminalVariables, TerminalCallback } from "shared/termvars";
import GameController from "./prefab/GameController";
import { HttpService, Players } from "@rbxts/services";

declare global {
	interface Controllers {
		TerminalController: (typeof TerminalController)["prototype"];
	}
}

class TerminalController extends GameController {
	constructor() {
		super("TerminalController");

		new TerminalCallback("echo", (user, ...content: string[]) => {
			let str_FinalContent = "";

			for (const element of content) {
				str_FinalContent += element + " ";
			}

			return str_FinalContent;
		});
	}

	async Execute(content: string) {
		if (content === "") return;

		// separate content
		const list_SeparatedCommands = content.split(";");

		for (const command of list_SeparatedCommands) {
			// Split the command to find the actual command and arguments
			const list_SplitCommand = command.split(" ");

			// so... we need to filter out what is a plain "" from the actual content...
			for (let i = 0; i < list_SplitCommand.size(); i++) {
				const element = list_SplitCommand[i];
				if (element !== "") break;

				list_SplitCommand.remove(i);
				i = 0;
			}

			let functionName = list_SplitCommand[0];
			if (!functionName) continue;
			if (functionName) functionName = string.gsub(functionName, "^%s+", "")[0]; // WHAT?
			if (functionName === "") continue;

			list_SplitCommand.remove(0);

			// Check to see if it is an TerminalVariable
			const termval = map_TerminalVariables.get(functionName);
			if (termval) {
				// Do they want just the info?
				if (list_SplitCommand.size() <= 0) {
					event_LogTerminal.Fire(`TerminalVariable ${termval.name}`);
					event_LogTerminal.Fire(`Current value: ${termval.get()} (def. ${termval.defaultval})`);
					event_LogTerminal.Fire(`Attributes: ${HttpService.JSONEncode(termval.attributes)}`); // LOL
					event_LogTerminal.Fire(`Description: ${termval.description}`);
					continue;
				}

				// Assigning a new value to it...
				if (termval.attributes.includes("READONLY")) {
					event_LogTerminal.Fire(`Unable to write TerminalValue ${termval.name}, variable is readonly.`);
					return; // Yes I know... this will break the loop... now you can shut up.
					// Me from the future: NO you did NOT know this because you were DRUNK you RETARD!
					// Monke sees "return;". monke sees "GOOD COUDE!!!"
				}

				let value: string | number = list_SplitCommand[0];

				const tonum = tonumber(value);
				if (tonumber(termval.defaultval) && tonum !== undefined) {
					value = tonum;
				}

				const [success, errorMessage] = pcall(() => termval.set(value));
				if (!success) {
					event_LogTerminal.Fire(`Unable to write TerminalValue ${termval.name}, ${errorMessage}`);
				}
				continue;
			}

			// Then it definetly is a callback...
			const termcall = map_TerminalCallbacks.get(functionName);
			if (termcall) {
				const [success, content] = pcall(() => termcall.invoke(Players.LocalPlayer, ...list_SplitCommand));
				if (success) {
					if (content !== "") event_LogTerminal.Fire(content);
				} else {
					event_LogTerminal.Fire(`Failed to invoke TerminalCallback, ${content}`);
				}
				continue;
			}

			// TODO: Invoking server callbacks / variables...

			// Then I don't know what ze shuck it is.
			// Did you really have to censor yourself on this one?
			event_LogTerminal.Fire(`Unknown command: ${functionName}`);
		}
	}
}

export = TerminalController;

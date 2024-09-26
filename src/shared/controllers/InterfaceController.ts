import { storage } from "shared/util/envfolders";
import GameController from "./prefab/GameController";
import { New } from "@rbxts/fusion";

declare global {
	interface Controllers {
		InterfaceController: (typeof InterfaceController)["prototype"];
	}
}

class InterfaceController extends GameController {
	private ControllerScreenGui = New("ScreenGui")({
		Parent: GameController.PlayerInstance.WaitForChild("PlayerGui"),
		Enabled: true,
		DisplayOrder: 99,
		Name: "ControllerScreenGui",
		IgnoreGuiInset: true,
		ResetOnSpawn: false,
	});

	constructor() {
		super("InterfaceController");

		// Import interface from storage
		for (const inst of storage.interface.GetChildren()) {
			if (!inst.IsA("ScreenGui")) continue;

			inst.Parent = GameController.PlayerInstance.WaitForChild("PlayerGui");
			inst.Enabled = false; // This must be managed by the scripts
			inst.IgnoreGuiInset = true;
			inst.ResetOnSpawn = false;
		}
	}
}

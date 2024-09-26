import { Players, ReplicatedStorage, RunService, ServerScriptService } from "@rbxts/services";
import UTIL_ReplicatedInst from "./replicatedinst";
import UTIL_LocalInst from "./localinst";

const envpaths = {
	source: RunService.IsClient() ? Players.LocalPlayer.WaitForChild("PlayerScripts") : ServerScriptService,
	shared: UTIL_ReplicatedInst(ReplicatedStorage, "shared", "Folder"),

	storage: {
		maps: UTIL_ReplicatedInst(ReplicatedStorage, "Maps", "Folder"),
	},

	entities: UTIL_LocalInst(workspace, "entities", "Folder"),
};

export = envpaths;

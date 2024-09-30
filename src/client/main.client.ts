import Fusion from "@rbxts/fusion";
import Iris from "@rbxts/iris";
import { Players, ReplicatedStorage, StarterGui } from "@rbxts/services";
import { t } from "@rbxts/t";
import GameController from "shared/controllers/prefab/GameController";
import { InitializeControllers, InitLifecycle } from "shared/core";
import { EngineRemoteFunction, InitializeNetworking } from "shared/core/network";
import { GetEntityFromId, InitializeEntitiesConstructor } from "shared/entities";
import envpaths from "shared/util/envfolders";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const player = Players.LocalPlayer;
const playergui = player.WaitForChild("PlayerGui");

const folder_Debug = envpaths.source.WaitForChild("debug");
const folder_Admin = envpaths.source.WaitForChild("admin");
const folder_Scripts = envpaths.shared.WaitForChild("scripts");

const list_IrisDebugCallbacks = new Array<Callback>();
const list_IrisAdminCallbacks = new Array<Callback>();

const b_UserIsAdmin = false;

const ib_FailToLoginReason = Iris.State("");
const ib_LoadingPopupVisible = Iris.State(false);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
function UpdateIrisRuntime() {
	for (const callback of list_IrisDebugCallbacks) callback();
	if (b_UserIsAdmin) for (const callback of list_IrisAdminCallbacks) callback();

	Iris.Window(["Loading", true, false, true, true, true, true, true, true, true], {
		isOpened: ib_LoadingPopupVisible,
		size: new Vector2(500, 200),
		position: workspace.CurrentCamera!.ViewportSize.mul(0.5).sub(new Vector2(250, 100)),
	}); // Jeez...
	{
		Iris.Text([`Raposo Framework`]);
		Iris.Separator();
		Iris.Text(["Now loading..."]);
	}
	Iris.End();

	if (ib_FailToLoginReason.value !== "") {
		Iris.Window(["Login failed!", true, false, true, true, true, true, true, true, true], {
			isOpened: ib_LoadingPopupVisible,
			size: new Vector2(500, 200),
			position: workspace.CurrentCamera!.ViewportSize.mul(0.5).sub(new Vector2(250, 100)),
		}); // Jeez...
		{
			Iris.Text([`Unable to login, server has replied with: ${ib_FailToLoginReason.get()}`]);
			Iris.Separator();

			if (Iris.Button(["Leave the game."]).clicked()) {
				player.Kick();
			}
		}
		Iris.End();
	}
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */
while (!ReplicatedStorage.GetAttribute("Loaded")) task.wait();

task.wait(2);

StarterGui.SetCoreGuiEnabled("All", false);

// Mount the Iris debug interface
Iris.Init();
Iris.Connect(UpdateIrisRuntime);

for (const inst of folder_Debug.GetChildren()) {
	if (!inst.IsA("ModuleScript")) continue;

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const call = require(inst);
	if (!call || !t.callback(call)) {
		throw `Invalid debug file callback: ${inst.Name}`;
	}

	list_IrisDebugCallbacks.push(call);
}
for (const inst of folder_Admin.GetChildren()) {
	if (!inst.IsA("ModuleScript")) continue;

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const call = require(inst);
	if (!call || !t.callback(call)) {
		throw `Invalid admin file callback: ${inst.Name}`;
	}

	list_IrisAdminCallbacks.push(call);
}

ib_LoadingPopupVisible.set(true);

task.wait(2);

// Login and initialize network
EngineRemoteFunction.InvokeServer();
InitializeEntitiesConstructor();
InitializeNetworking();
InitializeControllers();

// Execute scripts
for (const inst of folder_Scripts.GetChildren()) {
	if (!inst.IsA("ModuleScript")) continue;

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	coroutine.wrap(() => require(inst))();
}

task.wait(1);

InitLifecycle();
ib_LoadingPopupVisible.set(false);

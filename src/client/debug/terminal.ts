import Iris from "@rbxts/iris";
import { UserInputService } from "@rbxts/services";
import GameController from "shared/controllers/prefab/GameController";
import { event_LogTerminal } from "shared/termvars";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const list_LoggedContent = new Array<string>();

const ib_InputText = Iris.State("");
const ib_Visible = Iris.State(false);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
event_LogTerminal.Connect((content) => list_LoggedContent.push(content));

UserInputService.InputBegan.Connect((input) => {
	if (input.KeyCode === Enum.KeyCode.F2) {
		ib_Visible.set(!ib_Visible.get());

		if (ib_Visible.get()) {
			GameController.Controllers.CameraController.set_MouseUnlock.add("Console");
		} else {
			GameController.Controllers.CameraController.set_MouseUnlock.delete("Console");
		}
	}
});

function MakeWindow() {
	if (!ib_Visible.get()) return;

	Iris.Window(["Raposo terminal", false, false, true, true, true, true, true, true, true], {
		isOpened: ib_Visible,
		size: new Vector2(400, 400),
		position: workspace.CurrentCamera!.ViewportSize.mul(0.5).sub(new Vector2(200, 200)),
	}); // Jeez...
	{
		Iris.InputText(["Command input"], { text: ib_InputText });
		Iris.SameLine([]);
		{
			if (Iris.Button(["Execute"]).clicked()) {
				GameController.Controllers.TerminalController.Execute(ib_InputText.get());
				ib_InputText.set("");
			}
			if (Iris.Button(["Clear"]).clicked()) {
				list_LoggedContent.clear();
			}
		}
		Iris.End();

		for (const entry of list_LoggedContent) {
			Iris.Text([entry]);
		}
	}
	Iris.End();
}

export = MakeWindow;

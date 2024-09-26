import { New } from "@rbxts/fusion";
import GameController from "./prefab/GameController";
import WorldEntity from "shared/entities/WorldEntity";
import { GetEntityFromId } from "shared/entities";
import { UserInputService } from "@rbxts/services";
import { ConvertCF_V2, ConvertV2_CF } from "shared/util/mathconversion";

declare global {
	interface Controllers {
		CameraController: (typeof CameraController)["prototype"];
	}
}

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const camerainst = New("Camera")({
	Parent: workspace,
	Name: "ClientCamera",
});

let cf_CurrentOrigin = new CFrame(new Vector3(0, 1000, 0), new Vector3());
let v3_Offset = new Vector3();
let v2_DeltaRotation = new Vector2();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */
class CameraController extends GameController {
	set_MouseUnlock = new Set<string>();
	ent_Target: WorldEntity | undefined;

	constructor() {
		super("CameraController");
	}

	LateUpdate(dt: number) {
		UserInputService.MouseBehavior = this.set_MouseUnlock.isEmpty()
			? Enum.MouseBehavior.LockCenter
			: Enum.MouseBehavior.Default;
		camerainst.CameraType = Enum.CameraType.Scriptable;
		workspace.CurrentCamera = camerainst;

		let cf_Final = cf_CurrentOrigin;

		/* ------------------------------ Camera CFrame ----------------------------- */
		if (this.ent_Target && !GetEntityFromId(this.ent_Target.id)) {
			print("Invalid camera tracking entity id");
			this.ent_Target = undefined;
		}

		if (this.ent_Target) {
			cf_Final = this.ent_Target.IsA("CharacterEntity")
				? this.ent_Target.GetViewPosition()
				: new CFrame(this.ent_Target.origin).mul(new CFrame(Vector3.zero, this.ent_Target.angles));
		}

		v2_DeltaRotation = ConvertCF_V2(ConvertV2_CF(ConvertCF_V2(cf_Final).sub(ConvertCF_V2(camerainst.CFrame))));

		cf_CurrentOrigin = cf_Final;
		camerainst.CFrame = cf_Final;
	}

	SetCameraOffset(offset: Vector3) {
		v3_Offset = offset;
	}

	GetCameraInfo() {
		return {
			position: cf_CurrentOrigin.Position,
			rotation: cf_CurrentOrigin.LookVector,
			delta: v2_DeltaRotation,
		};
	}
}

export = CameraController;

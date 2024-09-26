import { CollectionService, RunService } from "@rbxts/services";
import CollisionGroups from "shared/util/collisiongroups";
import { storage } from "shared/util/envfolders";
import UTIL_ReplicatedInst from "shared/util/replicatedinst";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const envholder = UTIL_ReplicatedInst(workspace, "currentmap", "Folder");
export const envfolders = {
	parts: UTIL_ReplicatedInst(envholder, "parts", "Folder"),
	lights: UTIL_ReplicatedInst(envholder, "lights", "Folder"),
	ignore: UTIL_ReplicatedInst(envholder, "ignore", "Folder"),
	objects: UTIL_ReplicatedInst(envholder, "objects", "Folder"),
};

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
export function LoadEnvironment(name: string) {
	// Clean the currentmap folder
	const list_DissmissObjects = new Array<Instance>();
	for (const [name, inst] of envfolders as unknown as Map<string, Folder>) {
		inst.ClearAllChildren();
		list_DissmissObjects.push(inst);
	}
	for (const inst of envholder.GetChildren()) {
		if (list_DissmissObjects.includes(inst)) continue;

		inst.Destroy();
	}

	// Search for the target map
	const inst_TargetMap = storage.maps.WaitForChild(name, 1) as (Folder & typeof envfolders) | undefined;
	if (!inst_TargetMap) throw `Invalid map: ${name}`;

	// Clone everything from this map to the currentmap folder
	for (const inst of inst_TargetMap.GetChildren()) {
		const target = envholder.FindFirstChild(inst.Name);
		if (!inst.IsA("Folder") || !target) continue;

		for (const child of inst.GetChildren()) {
			const clone = child.Clone();
			clone.Parent = target;
		}
	}

	// Hide lights
	// TODO: Deprecate (objects folder is a thing)
	for (const inst of envfolders.lights.GetChildren()) {
		if (!inst.IsA("BasePart")) continue;

		inst.Transparency = 1;
	}

	// Manage objects
	for (const inst of envfolders.objects.GetChildren()) {
		if (!inst.IsA("BasePart") || inst.GetAttribute("Visible")) continue;

		inst.Transparency = 1;
		// inst.ClearAllChildren();

		if (RunService.IsStudio()) {
			const outline = new Instance("SelectionBox", inst);
			outline.Adornee = inst;
			outline.Color3 = new Color3(0, 1, 0);
			outline.LineThickness = 0.025;

			const billboardGui = new Instance("BillboardGui");
			billboardGui.Active = true;
			billboardGui.Size = UDim2.fromScale(5, 5);
			billboardGui.StudsOffset = new Vector3(0, 1, 0);
			billboardGui.Parent = inst;
			billboardGui.Adornee = inst;
			billboardGui.MaxDistance = 30;

			const textLabel = new Instance("TextLabel");
			textLabel.FontFace = Font.fromEnum(Enum.Font.SourceSansBold);
			textLabel.Text = inst.Name;
			textLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
			textLabel.TextSize = 16;
			textLabel.TextStrokeTransparency = 0;
			textLabel.BackgroundTransparency = 1;
			textLabel.Size = UDim2.fromScale(1, 1);
			textLabel.Parent = billboardGui;
		}
	}

	// Manage parts
	for (const inst of envfolders.parts.GetDescendants()) {
		if (!inst.IsA("BasePart")) continue;

		inst.CollisionGroup = CollisionGroups.World;
		inst.Parent = envfolders.parts;
		inst.Anchored = true;
		inst.CanTouch = false;
		inst.Massless = true;
		// inst.Transparency = 0; // This is probably stupid, but I don't care at the moment

		if (RunService.IsStudio() && inst.Transparency !== 0) {
			const outline = new Instance("SelectionBox", inst);
			outline.Adornee = inst;
			outline.Color3 = new Color3(1, 1, 1);
			outline.LineThickness = 0.025;
		}
	}
	for (const inst of envfolders.parts.GetChildren()) {
		if (inst.IsA("Model")) inst.Destroy();
	}
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */
// Loop through each map file, make sure that everything exists and register it.
for (const inst of CollectionService.GetTagged("map")) inst.Parent = storage.maps;

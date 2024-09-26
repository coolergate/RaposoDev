import { envfolders } from "shared/map";
import envpaths from "./envfolders";
import { t } from "@rbxts/t";
import { GetEntitiesWhichIsA } from "shared/entities";

class TraceParamsManager {
	constructor(
		private FilterContents: ("World" | "Entities")[],
		private FilterEntities: (keyof Entities)[],
		private EntitiesFilterType: "Whitelist" | "Blacklist",
		private RespectCanCollide: boolean,
	) {}

	GenerateTraceParams<B extends boolean, T extends B extends true ? OverlapParams : RaycastParams>(
		b_IsOverlap: B,
	): T {
		const list_SearchContent: Instance[] = [];

		if (this.FilterContents.includes("World")) {
			list_SearchContent.push(envfolders.parts);
		}
		if (this.FilterContents.includes("Entities")) {
			for (const entity of GetEntitiesWhichIsA("BaseEntity")) {
				if (
					(this.EntitiesFilterType === "Blacklist" && this.FilterEntities.includes(entity.classname)) ||
					(this.EntitiesFilterType === "Whitelist" && !this.FilterEntities.includes(entity.classname))
				)
					continue;

				for (const inst of entity.list_AssociatedInstances) {
					if (!inst.IsDescendantOf(envpaths.entities)) continue;
					list_SearchContent.push(inst);
				}
			}
			for (const inst of envpaths.entities.GetChildren()) {
				list_SearchContent.push(inst);
			}
			list_SearchContent.push(envpaths.entities);
		}

		const raycastparams = b_IsOverlap ? new OverlapParams() : new RaycastParams();
		raycastparams.FilterType = Enum.RaycastFilterType.Include;
		raycastparams.RespectCanCollide = this.RespectCanCollide;
		if (t.RaycastParams(raycastparams)) raycastparams.IgnoreWater = true;
		raycastparams.FilterDescendantsInstances = list_SearchContent;

		return raycastparams as T;
	}
}

export = TraceParamsManager;

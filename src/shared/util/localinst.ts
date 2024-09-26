import { CollectionService, RunService } from "@rbxts/services";
import UTIL_INSTEXIST from "./instexist";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const str_TargetTag = RunService.IsClient() ? "ClientLocalFolder" : "ServerLocalFolder";
const str_OppositeTag = RunService.IsClient() ? "ServerLocalFolder" : "ClientLocalFolder";

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
function UTIL_LocalInst<K extends keyof CreatableInstances, I extends CreatableInstances[K]>(
	parent: Instance,
	name: string,
	classname: K,
): I {
	const str_NewInstanceName = name + "_" + classname + "_" + str_TargetTag;
	let inst_Target =
		(parent.FindFirstChild(name) as I | undefined) || (parent.FindFirstChild(str_NewInstanceName) as I | undefined);

	if (inst_Target && !CollectionService.HasTag(inst_Target, str_OppositeTag) && inst_Target.IsA(classname)) {
		return inst_Target;
	}

	inst_Target = new Instance(classname) as I;
	inst_Target.Name = str_NewInstanceName;
	inst_Target.Parent = parent;
	CollectionService.AddTag(inst_Target, str_TargetTag);

	return inst_Target;
}

/* -------------------------------------------------------------------------- */
/*                                    Logic                                   */
/* -------------------------------------------------------------------------- */
coroutine.wrap(() => {
	while (task.wait(1))
		for (const inst of CollectionService.GetTagged(str_OppositeTag)) {
			if (!UTIL_INSTEXIST(inst)) continue;

			inst.Destroy();
		}
})();

CollectionService.GetInstanceAddedSignal(str_OppositeTag).Connect((inst) => inst.Destroy());

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */
export = UTIL_LocalInst;

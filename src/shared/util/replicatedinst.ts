import { RunService } from "@rbxts/services";

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */
function UTIL_ReplicatedInst<K extends keyof CreatableInstances, I extends CreatableInstances[K]>(
	parent: Instance,
	name: string,
	classname: K,
): I {
	let inst_Target = parent.FindFirstChild(name) as I | undefined;

	if (!inst_Target || !inst_Target.IsA(classname)) {
		if (RunService.IsClient()) {
			inst_Target = parent.WaitForChild(name + "_" + classname) as I;
			return inst_Target;
		}

		inst_Target = new Instance(classname) as I;
		inst_Target.Name = name + "_" + classname;
		inst_Target.Parent = parent;
	}

	return inst_Target;
}

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */
export = UTIL_ReplicatedInst;

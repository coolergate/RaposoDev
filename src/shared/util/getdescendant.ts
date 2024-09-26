function UTIL_GetFirstDescendant<K extends keyof Instances, T extends Instances[K]>(
	Inst: Instance,
	Name: string,
	ClassName?: K,
): T | undefined {
	for (const inst of Inst.GetDescendants()) {
		if (inst.Name !== Name) continue;
		if (ClassName !== undefined && inst.ClassName !== ClassName) continue;
		return inst as T;
	}

	return;
}

export = UTIL_GetFirstDescendant;

function GetTableDifference(newer: {}, original: {})
	local diff = {}

	for key, val in pairs(newer) do
		if not original[key] then
			diff[key] = val
			continue
		end

		if original[key] ~= val or typeof(original[key]) ~= typeof(val) then
			diff[key] = val
			continue
		end
	end

	return diff
end

return {
	GetTableDifference = GetTableDifference,
}

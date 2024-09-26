declare global {
	type t_GameKeycodes = Enum.KeyCode["Name"] | Enum.UserInputType["Name"] | "MouseWheelDown" | "MouseWheelUp";
}

export const map_InputBoundCommands = new Map<t_GameKeycodes, string>([
	["W", "+forward"],
	["S", "+back"],
	["A", "+left"],
	["D", "+right"],

	["Space", "+jump"],
	["ButtonA", "+jump"],

	["C", "+crouch"],
	["LeftControl", "+crouch"],
	["ButtonL3", "+crouch"],
]);

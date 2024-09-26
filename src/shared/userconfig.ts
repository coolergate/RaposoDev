import { TerminalVariable } from "./termvars";

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

export const obj_UserGameSettings = {
	joy_flipsticks: new TerminalVariable(
		"joy_flipsticks",
		false,
		["SAVE"],
		"Flip both the left and right gamepad joystick with each other",
	),
};

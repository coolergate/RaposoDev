import { RunService, UserInputService } from "@rbxts/services";

export function UTIL_ISMOBILE() {
	return RunService.IsClient() && UserInputService.TouchEnabled; // && !services.UserInputService.KeyboardEnabled && !services.UserInputService.MouseEnabled;
}
export function UTIL_ISCONSOLE() {
	return RunService.IsClient() && UserInputService.GamepadEnabled; // && !services.UserInputService.KeyboardEnabled && !services.UserInputService.MouseEnabled;
}

import { t } from "@rbxts/t";

export const Deg2Rad = (math.pi * 2) / 360;
export const Rad2Deg = 1 / Deg2Rad;

export function VectorReflect(vector: Vector3, normal: Vector3) {
	return normal.mul(-2 * vector.Dot(normal)).add(vector);
}

export function num_string_pad(num: number, size: number): string {
	let str_number = tostring(num);
	while (str_number.size() < size) str_number = "0" + str_number;
	return str_number;
}

export function Clamp01(value: number) {
	if (value < 0) return 0;
	else if (value > 1) return 1;
	else return value;
}

export function Lerp(a: number, b: number, perc: number) {
	return a + (b - a) * Clamp01(perc);
}

export function LerpUnclamped(a: number, b: number, perc: number) {
	return a + (b - a) * perc;
}

export function LerpAngle(a: number, b: number, perc: number) {
	return a + (b - a) * Clamp01(perc);
}

export function Repeat(t: number, length: number) {
	return math.clamp(t - math.floor(t / length) * length, 0, length);
}

export function DeltaAngle(current: number, target: number) {
	let delta = Repeat(target - current, 360);
	if (delta > 180) delta -= 360;
	return delta;
}

export function RoundAngle(n: number, step: number, rounding_amount = 0.5) {
	const sign = math.sign(n);
	n = math.abs(n);

	const normalized = n % step;
	const next_step = n - normalized + step;
	let final_value = n;

	if (normalized === 0 || normalized === step * rounding_amount) final_value = n - normalized;
	else {
		if (normalized < step * rounding_amount) final_value = n - normalized;
		if (normalized > step * rounding_amount) final_value = next_step;
	}

	return final_value * sign;
}

export function ConvertV2_CF(Angle: Vector2): CFrame {
	return CFrame.Angles(0, math.rad(Angle.X), 0).mul(CFrame.Angles(math.rad(Angle.Y), 0, 0));
}
export function ConvertCF_V2(CFrame: CFrame): Vector2 {
	const [y, x] = CFrame.ToOrientation();
	return new Vector2(math.deg(x), math.deg(y));
}

export function ConvertV3_CF(angle: Vector3): CFrame {
	return new CFrame(Vector3.zero, angle);
}

export function ConvertV3_V2(angle: Vector3): Vector2 {
	return ConvertCF_V2(ConvertV3_CF(angle));
}
export function ConvertV2_V3(angle: Vector2): Vector3 {
	return ConvertV2_CF(angle).LookVector;
}

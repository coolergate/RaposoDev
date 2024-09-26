import { RunService, StarterPlayer } from "@rbxts/services";
import { GetEntityFromId } from ".";
import HealthEntity from "./HealthEntity";
import { New } from "@rbxts/fusion";
import CollisionGroups from "shared/util/collisiongroups";
import TraceParamsManager from "shared/util/traceparam";
import envpaths from "shared/util/envfolders";

declare global {
	interface Entities {
		CharacterEntity: (typeof CharacterEntity)["prototype"];
	}
}

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */
const movementTraceParams = new TraceParamsManager(["World", "Entities"], ["CharacterEntity"], "Blacklist", true);

/* -------------------------------------------------------------------------- */
/*                               Movement class                               */
/* -------------------------------------------------------------------------- */
class MovementEntity extends HealthEntity {
	readonly part!: Part;
	private vforce!: VectorForce;

	v3_LastFootstepPosition = new Vector3();
	n_LastFootstepTime = 0;

	// Movement settings
	n_WalkSpeed = StarterPlayer.CharacterWalkSpeed;
	private n_RunSpeed = this.n_WalkSpeed * 2;
	private n_JumpPower = StarterPlayer.CharacterJumpPower;
	private n_GroundFriction = 10;
	private n_Acceleration = 1;
	private n_Deacceleration = 6;
	private n_SideStrafeAccel = 100;
	private n_SideStrafeSpeed = 2; // this is what nerfs the airstrafe... might make some ppl mad :)
	private n_MaxSlopeAngle = 50;

	inst_CurrentGroundInstance: BasePart | undefined;

	constructor() {
		super();

		this.RegisterReplicatedValue("part");

		if (RunService.IsClient()) {
			this.part = New("Part")({
				Parent: envpaths.entities,
				Size: new Vector3(2, 3, 2),
				Position: new Vector3(0, 1000, 0),
				Anchored: true,
				Transparency: 1,
				Massless: true,
				CustomPhysicalProperties: new PhysicalProperties(1, 0, 0, 100, 100),
				CollisionGroup: CollisionGroups.Players,
			});

			const attachment = New("Attachment")({
				Parent: this.part,
			});

			this.vforce = New("VectorForce")({
				Parent: this.part,
				Attachment0: attachment,
				ApplyAtCenterOfMass: true,
				Force: new Vector3(),
			});

			New("AlignOrientation")({
				Parent: this.part,
				Mode: Enum.OrientationAlignmentMode.OneAttachment,
				Attachment0: attachment,
				RigidityEnabled: true,
			});

			New("PathfindingModifier")({
				PassThrough: true,
				Parent: this.part,
			});

			this.AssociateInstance(this.part);
		}

		this.OnDelete(() => {
			this.part?.Destroy();
		});
	}

	GroundAccelerate(
		currspeed: Vector3,
		wishdir: Vector3,
		wishspeed: number,
		accel: number,
		dt: number,
		crouch = false,
	) {
		const horizontalvel = currspeed.mul(new Vector3(1, 0, 1));

		const currentspeed = horizontalvel.Dot(wishdir);
		const addspeed = wishspeed - currentspeed;

		if (addspeed <= 0) return horizontalvel;

		let accelspeed = accel * dt * wishspeed * (this.n_GroundFriction * (crouch ? 0.5 : 1));
		if (accelspeed > addspeed) accelspeed = addspeed;

		const x = horizontalvel.X + accelspeed * wishdir.X;
		const z = horizontalvel.Z + accelspeed * wishdir.Z;
		return new Vector3(x, 0, z);
	}

	ApplyFriction(v3_CurrSpeed: Vector3, n_DeltaTime: number) {
		const v3_HorizontalVelocity = v3_CurrSpeed.mul(new Vector3(1, 0, 1));
		const n_Speed = v3_HorizontalVelocity.Magnitude;

		const n_Control = (n_Speed < this.n_Deacceleration && this.n_Deacceleration) || n_Speed;
		const n_Drop = n_Control * this.n_GroundFriction * n_DeltaTime;

		let n_NewSpeed = math.clamp(n_Speed - n_Drop, 0, math.huge);
		if (n_Speed > 0) n_NewSpeed /= n_Speed;

		const x = v3_HorizontalVelocity.X * n_NewSpeed;
		const z = v3_HorizontalVelocity.Z * n_NewSpeed;
		return new Vector3(x, 0, z);
	}

	GetHipheight() {
		return math.clamp(this.size.Y - this.part.Size.Y, 0, math.huge);
	}

	CheckGround(b_AlreadyGrounded: boolean) {
		const part_MovementObj = this.part;

		const partpos = part_MovementObj.Position;
		const partsize = part_MovementObj.Size;

		const n_CheckSize = 0.25;
		const v3_StartPos = partpos.add(new Vector3(0, partsize.Y * 0.5 - n_CheckSize * 0.5, 0));
		const v3_ScanSize = new Vector3(partsize.X - 0.1, n_CheckSize, partsize.Z - 0.1);

		const trace = workspace.Blockcast(
			new CFrame(v3_StartPos),
			v3_ScanSize,
			new Vector3(0, -1000, 0),
			movementTraceParams.GenerateTraceParams(false),
		);
		if (!trace) return;

		const n_hipheightpos = part_MovementObj.Position.Y - part_MovementObj.Size.Y * 0.5 - this.GetHipheight();

		if (trace.Position.Y >= n_hipheightpos - (b_AlreadyGrounded ? 1 : 0)) return trace;
	}

	UpdateMovement(buttons: UserButtons, n_DeltaTime: number) {
		const part = this.part;

		let v3_FinalVelocity = part.AssemblyLinearVelocity;
		let ray_GroundCheck = this.CheckGround(this.inst_CurrentGroundInstance !== undefined);
		const n_hipheight = this.GetHipheight();

		// slope check
		if (ray_GroundCheck) {
			const direction = CFrame.lookAt(
				ray_GroundCheck.Position,
				ray_GroundCheck.Position.add(ray_GroundCheck.Normal),
			);
			const angle = math.deg(direction.LookVector.Angle(new Vector3(0, 1, 0)));
			if (angle > this.n_MaxSlopeAngle) ray_GroundCheck = undefined;
		}

		// jumping
		if (ray_GroundCheck && buttons.jump) {
			v3_FinalVelocity = new Vector3(
				v3_FinalVelocity.X,
				math.max(0, v3_FinalVelocity.Y) + this.n_JumpPower, // this is where the jump boosts happens
				v3_FinalVelocity.Z,
			);

			part.Position = new Vector3(
				part.Position.X,
				ray_GroundCheck.Position.Y + n_hipheight + part.Size.Y * 0.5,
				part.Position.Z,
			);
			part.Position = part.Position.add(new Vector3(0, 0.2, 0));

			ray_GroundCheck = undefined;
			this.inst_CurrentGroundInstance = undefined;
		}

		// ground movement
		if (ray_GroundCheck) {
			v3_FinalVelocity = this.ApplyFriction(v3_FinalVelocity, n_DeltaTime);
			v3_FinalVelocity = this.GroundAccelerate(
				v3_FinalVelocity,
				buttons.wishdir,
				buttons.wishdir.Magnitude > 0
					? buttons.sprint
						? this.n_RunSpeed
						: buttons.crouch
							? this.n_WalkSpeed * 0.75
							: this.n_WalkSpeed
					: 0,
				this.n_Acceleration,
				n_DeltaTime,
				buttons.crouch,
			);

			part.Position = new Vector3(
				part.Position.X,
				ray_GroundCheck.Position.Y + n_hipheight + part.Size.Y / 2,
				part.Position.Z,
			);

			// air movement
			if (!ray_GroundCheck && buttons.wishdir.Magnitude > 0) {
				const vertical_speed = v3_FinalVelocity.Y;

				v3_FinalVelocity = this.GroundAccelerate(
					v3_FinalVelocity,
					buttons.wishdir,
					this.n_SideStrafeSpeed,
					this.n_SideStrafeAccel,
					n_DeltaTime,
				).add(new Vector3(0, vertical_speed, 0));
			}

			this.vforce.Force = new Vector3(0, part.GetMass() * workspace.Gravity, 0);
			this.vforce.Enabled = ray_GroundCheck !== undefined;

			part.AssemblyLinearVelocity = v3_FinalVelocity;

			this.inst_CurrentGroundInstance = ray_GroundCheck?.Instance;

			this.origin = part.Position.sub(new Vector3(0, n_hipheight / 2, 0));
			this.velocity = part.AssemblyLinearVelocity;
		}
	}
}

/* -------------------------------------------------------------------------- */
/*                               Character class                              */
/* -------------------------------------------------------------------------- */
class CharacterEntity extends MovementEntity {
	owner: string | undefined;

	size = new Vector3(2, 5, 2);

	constructor() {
		super();

		this.classname = "CharacterEntity";
		this.set_IsA.add("CharacterEntity");

		this.RegisterReplicatedValue("owner");
	}

	GetOwner() {
		const entity = GetEntityFromId(this.owner || "");
		if (!entity || !entity.IsA("UserEntity")) return;

		return entity;
	}

	Think(dt: number) {
		const ent_OwnerEntity = this.GetOwner();
		if (!ent_OwnerEntity || !RunService.IsClient()) return;

		if (!this.part.Anchored) this.UpdateMovement(ent_OwnerEntity.buttons, dt);
	}

	Respawn() {
		this.part.Anchored = false;
		this.part.Position = new Vector3(0, 5, 1);
	}

	GetViewPosition() {
		const halfsize = this.size.mul(new Vector3(0, 0.5, 0));
		const origin = RunService.IsServer()
			? this.origin.add(halfsize).sub(new Vector3(0, 0.5, 0))
			: this.part.Position.add(halfsize).sub(new Vector3(0, 0.5, 0));

		return new CFrame(origin).mul(new CFrame(Vector3.zero, this.angles).Rotation);
	}
}

export = CharacterEntity;
